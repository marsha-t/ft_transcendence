# Variables
VOLUMES = user-social-data game-tournament-data 


all: build up 

up:
	cd srcs && docker compose up -d

down:
	cd srcs && docker compose down

build:
	cd srcs && docker compose build

clean: down
	-docker rmi -f $(shell docker images -q)

re: fclean all

fclean: clean
	- docker rm $(docker container ls -q) -f 
	- docker volume rm $(VOLUMES)
	- yes | docker system prune -a --volumes
	- rm -rf $(BIND_MOUNTS)
	- find srcs/backend/auth-service/uploads/avatars \
	    -maxdepth 1 \
	    -type f \
	    ! \( \
	        -name "default.png" -o \
	        -name "user_avatar-1.jpg" -o \
	        -name "user_avatar-2.jpg" -o \
	        -name "user_avatar-3.png" -o \
	        -name "user_avatar-4.jpg" \
	    \) \
	    -exec rm {} \;
.PHONY: all up down build clean re fclean