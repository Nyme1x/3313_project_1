#include <iostream>
#include <fstream>
#include <sstream>
#include <map>
#include <vector>
#include <thread>
#include <mutex>
#include <algorithm>
#include <cstdlib>
#include <cstring>
#include <unistd.h>
#include <chrono> 
#include <websocketpp/config/asio_no_tls.hpp>
#include <websocketpp/server.hpp>
#include <functional>
#include <queue>
#include <condition_variable>
#include <openssl/bio.h>
#include <openssl/evp.h>
#include <string>

using namespace std;

using websocketpp::lib::placeholders::_1;
using websocketpp::lib::placeholders::_2;
using websocketpp::lib::bind;

mutex chatrooms_mtx;

// Represents a message in the chatroom
struct Message {
    string sender;
    string content;
    string timestamp;
    bool isVoice; 
    vector<uint8_t> audioData; 
};

// Represents a user in the chatroom
struct User {
    string username;
    std::weak_ptr<void> connection;
};

// ThreadPool class, used to handle and execute tasks on multiple threads executing them in parallel. 
// Each message on different threads without having to open and close threads
class ThreadPool {
public:
    // Constructor creating a specified number of worker threads and starting them when the class is called
    // Reach thread runs a loop that waits for tasks to be added to the queue, when a task is added, it removes it from the queue and then then executes it.
    ThreadPool(size_t threads) : stop(false) {
        for(size_t i = 0; i < threads; ++i) {
            workers.emplace_back([this] {
                for(;;) {
                    std::function<void()> task;

                    {
                        std::unique_lock<std::mutex> lock(this->queue_mutex);
                        this->condition.wait(lock, [this] { return this->stop || !this->tasks.empty(); });
                        if(this->stop && this->tasks.empty())
                            return;
                        task = std::move(this->tasks.front());
                        this->tasks.pop();
                    }

                    task();
                }
            });
        }
    }

    size_t getWorkerCount() const {
        return workers.size();
    }

    // Destructor to stop all the worker threads waiting for them to finish their current tasks.
    // This is where the stopping of threads are handled properly. 
    ~ThreadPool() {
        {
            std::unique_lock<std::mutex> lock(queue_mutex);
            stop = true;
        }
        condition.notify_all();
        for(std::thread &worker: workers)
            worker.join();
    }

    template<class F, class... Args>
    auto enqueue(F&& f, Args&&... args) 
        -> std::future<typename std::result_of<F(Args...)>::type> {
        using return_type = typename std::result_of<F(Args...)>::type;

        auto task = std::make_shared< std::packaged_task<return_type()> >(
            std::bind(std::forward<F>(f), std::forward<Args>(args)...)
        );
        
        std::future<return_type> res = task->get_future();
        {
            std::unique_lock<std::mutex> lock(queue_mutex);

            // Don't allow enqueueing after stopping the pool
            if(stop)
                throw std::runtime_error("enqueue on stopped ThreadPool");

            tasks.emplace([task](){ (*task)(); });
        }
        condition.notify_one();
        return res;
    }

private:
    std::vector< std::thread > workers;
    std::queue< std::function<void()> > tasks;
    
    std::mutex queue_mutex;
    std::condition_variable condition;
    bool stop;
};


// Represents a chatroom
class Chatroom {
private:
    string room_code;
    vector<User> users;
    vector<Message> messages;
    websocketpp::server<websocketpp::config::asio>* server;

public:

    // Constructors
    Chatroom() : server(nullptr) {} 

    Chatroom(string code, websocketpp::server<websocketpp::config::asio>* srv) : room_code(code), server(srv) {}

    // Adding users to the chatroom
    void addUser(const User& user) {
        users.push_back(user);
    }

    // Removing users from the chatroom
    void removeUser(std::weak_ptr<void> connection) {
        users.erase(remove_if(users.begin(), users.end(), [&](const User& u) { return u.connection.lock().get() == connection.lock().get(); }), users.end());
    }

    // function to return all the users (sending users in a chatroom)
    const vector<User>& getUsers() const {
        return users;
    }

    // This is the function that sends all the messages and voice messages as well to the different users
    void broadcastMessage(const string& sender, const string& message, bool isVoice = false, const vector<uint8_t>& audioData = {}) {
        string formatted_message;
        if (isVoice) {
            // Send audio data
            for (auto& user : users) {
                server->send(user.connection, audioData.data(), audioData.size(), websocketpp::frame::opcode::binary);
            }
        } else {
            // Send text message
            formatted_message =  sender + ": " + message;
            for (auto& user : users) {
                server->send(user.connection, formatted_message, websocketpp::frame::opcode::text);
            }
        }
        // Apend to the messages vector
        messages.push_back({sender, message, getCurrentTimestamp(), isVoice, audioData});
    }

    // All the history of the chats are stored and sent upon connection (called in the "Join" request where it sends the messages)
    void sendHistory(websocketpp::connection_hdl connection) {
        for (const auto& message : messages) {
            if (message.isVoice) {
                server->send(connection, message.audioData.data(), message.audioData.size(), websocketpp::frame::opcode::binary);
            }else{
                string formatted_message = message.sender + ": " + message.content;
                server->send(connection, formatted_message, websocketpp::frame::opcode::text);
            }
        }
    }

    // Time when messages/requests are made or sent
    string getCurrentTimestamp() {
        auto now = chrono::system_clock::now();
        auto now_time_t = chrono::system_clock::to_time_t(now);
        stringstream ss;
        ss << put_time(localtime(&now_time_t), "%Y-%m-%d %H:%M:%S");
        return ss.str();
    }
};


// Creates a thread pool with number of threads (here it is 8)
ThreadPool pool(8);

// Map to store all the chatrooms
map<string, Chatroom> chatrooms;

// Reading the .env file to get the environment variables
map<string, string> readEnvFile(const string& filePath) {
    ifstream file(filePath);
    string line;
    map<string, string> envVariables;

    while (getline(file, line)) {
        stringstream lineStream(line);
        string key, value;
        if (getline(lineStream, key, '=') && getline(lineStream, value)) {
            envVariables[key] = value;
        }
    }

    return envVariables;
}

// Function for decoding base64 data into binary data
std::vector<uint8_t> decodeBase64(const std::string& input) {
    // Calculate approximate length of decoded data and prepare buffer
    std::vector<uint8_t> decodedBytes(((input.length() / 4) * 3) + 1);

    // Create a memory buffer containing the base64 data
    BIO* bio = BIO_new_mem_buf(input.data(), static_cast<int>(input.length()));
    // Tell BIO to treat the buffer as base64 encoded
    BIO* b64 = BIO_new(BIO_f_base64());
    bio = BIO_push(b64, bio);

    // Do not use newlines to flush buffer
    BIO_set_flags(bio, BIO_FLAGS_BASE64_NO_NL);

    // Decode into buffer, knowing the output size
    int decodedLength = BIO_read(bio, decodedBytes.data(), static_cast<int>(input.length()));

    // Handle potential error
    if(decodedLength < 0) {
        BIO_free_all(bio);
        throw std::runtime_error("Error decoding base64 string");
    }

    // Resize buffer to actual decoded length
    decodedBytes.resize(decodedLength);

    // Clean up
    BIO_free_all(bio);

    return decodedBytes;
}

// Function to generate a random number (4 digits) for the chatroom code
string generate_room_code() {
    string code;
    bool isUnique = false;

    lock_guard<mutex> guard(chatrooms_mtx);

    while (!isUnique) {
        code.clear();
        srand(time(NULL) + rand());

        for (int i = 0; i < 4; ++i) {
            code += '0' + rand() % 10;
        }

        if (chatrooms.find(code) == chatrooms.end()) {
            isUnique = true;
        }
    }

    return code;
}

// The entry point function that handles all the requests sent through the websocket connections 
void on_message(websocketpp::server<websocketpp::config::asio>* server, websocketpp::connection_hdl hdl, websocketpp::server<websocketpp::config::asio>::message_ptr msg) {
    pool.enqueue([server, hdl, msg]() {
        string cmd = msg->get_payload();
        string room_code; 
        string message; 

        if (cmd.substr(0, 6) == "CREATE") {
            string room_code = generate_room_code();
            {
                lock_guard<mutex> guard(chatrooms_mtx);
                chatrooms[room_code] = Chatroom(room_code, server);
            }
            server->send(hdl, room_code, websocketpp::frame::opcode::text);
            cout << "\nClient " << hdl.lock().get() << " has created a chatroom with code: " << room_code << endl;
        } 
        else if (cmd.substr(0, 4) == "JOIN") {
            stringstream ss(cmd);
            string command, room_code, username;
            getline(ss, command, ':');
            getline(ss, room_code, ':');
            getline(ss, username, ':');
            
            lock_guard<mutex> guard(chatrooms_mtx);
            if (chatrooms.find(room_code) != chatrooms.end()) {
                User newUser = {username, hdl.lock()};
                chatrooms[room_code].addUser(newUser);
                chatrooms[room_code].sendHistory(hdl);
                cout << "\nUser " << username << " (" << hdl.lock().get() << ") has joined chatroom with code: " << room_code << endl;
            } else {
                const char* errMsg = "Invalid room code";
                server->send(hdl, errMsg, strlen(errMsg), websocketpp::frame::opcode::text);
            }        
        } 
        else if (cmd.substr(0, 4) == "MSG:") {
            stringstream ss(cmd);
            string command, room_code, messageContent;
            getline(ss, command, ':');
            getline(ss, room_code, ':');
            getline(ss, messageContent); // Directly get the rest as the message content

            lock_guard<mutex> guard(chatrooms_mtx);
            auto& chatroom = chatrooms[room_code];
            auto it = find_if(chatroom.getUsers().begin(), chatroom.getUsers().end(), [&](const User& user) {
                return user.connection.lock().get() == hdl.lock().get();
            });
            if (it != chatroom.getUsers().end()) {
                // User found, broadcast message using their username
                chatroom.broadcastMessage(it->username, messageContent);
            } else {
                const char* errMsg = "User not found in room";
                server->send(hdl, errMsg, strlen(errMsg), websocketpp::frame::opcode::text);
            }
        } 
        else if (cmd.substr(0, 5) == "VOICE") {
            stringstream ss(cmd);
            string command, room_code, base64AudioData;
            getline(ss, command, ':');
            getline(ss, room_code, ':');
            getline(ss, base64AudioData); // Get the rest as base64 encoded audio data

            // Decode base64 to binary
            vector<uint8_t> audioData = decodeBase64(base64AudioData);
            
            auto& chatroom = chatrooms[room_code];
            auto it = find_if(chatroom.getUsers().begin(), chatroom.getUsers().end(), [&](const User& user) {
                return user.connection.lock().get() == hdl.lock().get();
            });
            if (it != chatroom.getUsers().end()) {
                // User found, broadcast message using their username
                chatroom.broadcastMessage(it->username, "", true, audioData);
            } else {
                const char* errMsg = "User not found in room";
                server->send(hdl, errMsg, strlen(errMsg), websocketpp::frame::opcode::text);
            }
        } 
        else if (cmd == "LIST_CHATROOMS") {
            stringstream chatroomsList;
            chatroomsList << "[";

            {
                lock_guard<mutex> guard(chatrooms_mtx);
                bool firstItem = true;
                for (const auto& chatroom : chatrooms) {
                    if (!firstItem) {
                        chatroomsList << ",";
                    } else {
                        firstItem = false;
                    }
                    chatroomsList << "{\"room_code\":\"" << chatroom.first << "\"}";
                }
            }

            chatroomsList << "]";
            string response = chatroomsList.str(); // Convert the stringstream to string
            server->send(hdl, response, websocketpp::frame::opcode::text);
            cout << "\nSent list of chatrooms to client " << hdl.lock().get() << endl;
        } 
    });
}

// Handles client disconnection from the server
void on_close(websocketpp::server<websocketpp::config::asio>* server, websocketpp::connection_hdl hdl) {
    lock_guard<mutex> guard(chatrooms_mtx);
    for (auto& chatroom : chatrooms) {
        chatroom.second.removeUser(hdl.lock());
    }
    cout << "\nClient " << hdl.lock().get() << " has disconnected." << endl;
}

// Function to allow server to accept any other host over http
void on_http(websocketpp::server<websocketpp::config::asio>* s, websocketpp::connection_hdl hdl) {
    typename websocketpp::server<websocketpp::config::asio>::connection_ptr con = s->get_con_from_hdl(hdl);
    con->append_header("Access-Control-Allow-Origin", "*");
    con->append_header("Access-Control-Allow-Methods", "GET, POST");
    con->append_header("Access-Control-Allow-Headers", "Content-Type");
    con->append_header("Access-Control-Allow-Headers", "X-Auth-Token");
    con->append_header("Access-Control-Allow-Headers", "Origin");
    con->append_header("Access-Control-Allow-Headers", "Authorization");
}

// This function stops the server from listening for new connections but it does allow current requests to complete
void closeListeningSocket(websocketpp::server<websocketpp::config::asio>& server) {
    std::cout << "Stopping listening for new connections..." << std::endl;
    server.stop_listening();
}

// This function iterates over all chatrooms and users, closing the connection for each user to ensure they are properly disconnected from the server
void disconnectAllClients(websocketpp::server<websocketpp::config::asio>& server, map<string, Chatroom>& chatrooms) {
    std::cout << "Disconnecting all clients..." << std::endl;
    for (auto& chatroom : chatrooms) {
        for (auto& user : chatroom.second.getUsers()) {
            if(auto conn = user.connection.lock()) {
                server.close(conn, websocketpp::close::status::going_away, "Server is shutting down");
                cout << "Disconnected all clients" << endl;
            }
        }
    }
}

// This function deletes all resources related to the chatrooms preventing memory leaks
void cleanupResources(map<string, Chatroom>& chatrooms) {
    std::cout << "Cleaning up resources..." << std::endl;
    chatrooms.clear();
}

// Function to handle server being gracefully terminated. Threads are stopped by the ThreadPool class 
void handleServerTermination(websocketpp::server<websocketpp::config::asio>& server, map<string, Chatroom>& chatrooms) {
    std::cout << "\nHandling server termination..." << std::endl;
    closeListeningSocket(server);
    disconnectAllClients(server, chatrooms);
    cleanupResources(chatrooms);

    std::cout << "Server terminated successfully.\n" << std::endl;
    // Exiting the program
    exit(EXIT_SUCCESS);
}

// Function to check whether the user is attempting to terminate the server or not.
void handleUserInput(websocketpp::server<websocketpp::config::asio>& server, map<string, Chatroom>& chatrooms) {
    string command;
    while (true) {
        cin >> command;
        if (command == "done") {
            handleServerTermination(server, chatrooms);
        }
    }
}

// Entry point of the application (where everything runs.)
int main() {
    map<string, string> env = readEnvFile(".env");
    int PORT = stoi(env["PORT"]);
    string HOST = env["HOST"];

    websocketpp::server<websocketpp::config::asio> server;

    try {
        server.set_message_handler(bind(&on_message, &server, ::_1, ::_2));
        server.set_close_handler(bind(&on_close, &server, ::_1)); 
        server.init_asio();
        server.set_http_handler(bind(&on_http, &server, ::_1));
        server.listen(PORT);
        server.start_accept();
        
        cout << "Server listening on port: " << PORT << " accepting hosts from: " << HOST << endl;
        cout << "You can stop the server by simply typing 'done' onto the terminal" << endl;

        // Run server on main thread
        thread userInputThread(handleUserInput, std::ref(server), std::ref(chatrooms));
        server.run();

        // Wait for user input thread to finish
        userInputThread.join();
    } 
    catch (websocketpp::exception const & e) {
        cout << "Exception: " << e.what() << endl;
    } 
    catch (...) {
        cout << "Unknown exception" << endl;
    }

    return 0;
}
