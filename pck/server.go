package server

import "github.com/gofiber/fiber/v2"

type Server struct {
	port string
	staticPath string
	templatePath string
	app *fiber.App
}

func (s *Server) Init(port string, staticPath string, templatePath string){
	app := fiber.New()

	s.port = port
	s.staticPath = staticPath
	s.templatePath = templatePath
	s.app = app
}

func (s *Server) Run() error{
	app := s.app

	app.Get("/", func(c *fiber.Ctx) error {
        return c.SendString("Hello, World!")
    })

    return app.Listen(":3000")
}