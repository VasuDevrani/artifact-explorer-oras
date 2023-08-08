# ORAS Artifact Explorer

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Build Status](https://travis-ci.org/VasuDevrani/artifact-explorer-oras.svg?branch=main)](https://travis-ci.org/VasuDevrani/artifact-explorer-oras)
[![Docker Pulls](https://img.shields.io/docker/pulls/vasudevrani/oras-artifact-explorer.svg)](https://hub.docker.com/repository/docker/vasudevrani/oras-artifact-explorer)
[![Go Report Card](https://goreportcard.com/badge/github.com/VasuDevrani/artifact-explorer-oras)](https://goreportcard.com/report/github.com/VasuDevrani/artifact-explorer-oras)

## Table of Contents

- [About the Project](#about-the-project)
  - [Features](#features)
  - [Target Users](#target-users)
  - [Benefits](#benefits)
- [Steps to Run](#steps-to-run)
- [Docker Image](#docker-image)
- [Code of Conduct](#code-of-conduct)
- [Contributions](#contributions)

## About the Project

The ORAS Artifact Explorer project aims to enhance the efficiency of image developers and users by providing a user-friendly tool that utilizes the ORAS framework. This tool empowers users to effortlessly explore and search the contents of artifacts and OCI registries.

### Features

- Web Portal: View OCI artifact contents from various OCI registries through a user-friendly web portal, offering a registry-like dashboard or JSON view.
- Detailed Exploration: Drill down into image manifests and layers, enabling users to delve into the intricate details of artifacts.
- Artifact Reference Graph: Visualize the reference graph of artifacts directly from the web portal.
- Supply Chain Artifacts: Access supply chain-related artifacts like signatures, SBOMs, and attestations.
- Referrer Files: Download referrer files seamlessly from the web portal.
- Search Capabilities: Utilize powerful search capabilities to query container images and OCI artifacts through a centralized web interface.
- List Repositories: List repositories in MCR (Microsoft Container Registry) for convenient management.
- Offline Execution: Generate oras CLI commands for offline execution, streamlining workflow processes.
- File System Exploration: Explore image file systems and layers, expanding the scope of ORAS capabilities.

### Target Users

- Image Publishers and Developers
- Users of Docker Hub, GitHub Container Registry (GHCR), and Microsoft Artifact Registry (MAR)
- Users of CNCF Distribution Platforms

### Benefits

For Users:
- Streamlined Learning: Reduces the learning curve of the ORAS CLI, enhancing developer efficiency.
- Simplified Exploration: Enables users to explore OCI artifacts and registries without memorizing complex CLI commands.
- Easy Sharing: Facilitates sharing of artifact content links with others, enhancing collaboration.

For the ORAS Community:
- Concept Promotion: Promotes understanding of OCI and ORAS concepts.
- Increased Traffic: Drives traffic to the ORAS website by providing an efficient tool for image developers.

## Getting Started

## Steps to Run

1. Clone the repository:

   ```sh
   git clone https://github.com/VasuDevrani/artifact-explorer-oras.git
   ```

2. Navigate to the command directory:

   ```sh
   cd /artifact-explorer-oras/cmd
   ```

3. Run the application:

   ```sh
   go run .
   ```

4. Access the web portal:

   Open your web browser and navigate to `http://localhost:3000`.

## Docker Image

Find the Docker image at:

[vasudevrani/oras-artifact-explorer](https://hub.docker.com/repository/docker/vasudevrani/oras-artifact-explorer/general)

### Code of Conduct

This project adheres to the CNCF Code of Conduct. Please refer to [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for further details.

### Contributions

We appreciate your time and effort in considering contributions to the project. Please refer to the [Contribution Guide](CONTRIBUTING.md) to learn more about how you can contribute.

---

**Note:** This project is not officially endorsed by the CNCF.
