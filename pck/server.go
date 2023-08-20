package server

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/template/html/v2"
)

type Server struct {
	port         string
	staticPath   string
	templatePath string
	app          *fiber.App
}

func Init(port, staticPath, templatePath string) *Server {
	engine := html.New(staticPath, templatePath)
	app := fiber.New(fiber.Config{
		Views: engine,
	})

	app.Static("/static", "../web/static")

	app.Use(cors.New())

	s := &Server{
		port:         port,
		staticPath:   staticPath,
		templatePath: templatePath,
		app:          app,
	}
	s.configureRoutes()

	return s
}

func (s *Server) Run() error {
	return s.app.Listen(":" + s.port)
}

func (s *Server) configureRoutes() {
	AppRouter(s.app)
}