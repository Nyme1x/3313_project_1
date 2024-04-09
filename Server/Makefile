CXX = g++
CXXFLAGS = -std=c++11 -pthread
INC_DIRS = -I/path/to/openssl/include
LIB_DIRS = -L/path/to/openssl/lib
LIBS = -lssl -lcrypto -lboost_system

SRCS = Server.cpp
OBJS = $(SRCS:.cpp=.o)
TARGET = Server

all: $(TARGET)

$(TARGET): $(OBJS)
	$(CXX) $(CXXFLAGS) $(INC_DIRS) $(LIB_DIRS) -o $@ $(OBJS) $(LIBS)

.cpp.o:
	$(CXX) $(CXXFLAGS) $(INC_DIRS) -c $< -o $@

clean:
	$(RM) $(TARGET) $(OBJS)