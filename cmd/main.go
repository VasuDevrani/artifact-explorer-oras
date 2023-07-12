package main

import (
	"log"
	s "github.com/vasudevrani/artifact-explorer-oras/pck"
)

func main() {
	ser := s.Init("3000", "./web", ".html")

	err := ser.Run()
	if(err != nil) {
		log.Fatal("Some error occured: ", err)
	}
}
