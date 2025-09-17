# Variables
CONTAINERS = backend frontend
# VOLUMES = 

all: build up 

up:
	cd srcs && docker-compose up -d

down:
	cd srcs && docker-compose down

build:
	cd srcs && docker-compose build

clean: down
	-docker rmi -f $(shell docker images -q)

re: clean all

fclean:
	- docker rm $(CONTAINERS) -f 
	- docker volume rm $(VOLUMES)
	- yes | docker system prune -a --volumes

.PHONY: all up down build clean re fclean