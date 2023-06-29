package server

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/template/html/v2"
)

type Server struct {
	port string
	staticPath string
	templatePath string
	
	app *fiber.App
	htmlEngine *html.Engine
}

func Init(port string, staticPath string, templatePath string) Server{
	var s Server
	engine := html.New(staticPath, templatePath)

	app := fiber.New(fiber.Config{
        Views: engine,
    })

	s.port = port
	s.staticPath = staticPath
	s.templatePath = templatePath
	s.app = app

	return s
}

func (s *Server) Run() error{
	app := s.app
	app.Use(cors.New())

	AppRouter(app)

    return app.Listen(":3000")
}