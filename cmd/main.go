package main

import (
	"log"
	s "github.com/vasudevrani/artifact-explorer-oras/pck"
)

func main() {
	var ser s.Server

	ser.Init("3000", "../web", "")

	err := ser.Run()
	if(err != nil) {
		log.Fatal("Some error occured: ", err)
	}
}
