import http from "http";
import app from "./app";
import atomaSDK from "./config/atoma";
import config from "./config/config";
import { AtomaSDK } from "atoma-sdk";

/**
 * Main application class that initializes and starts the server
 */
class Main {
  private atoma: AtomaSDK;
  private port: string | number;

  /**
   * Initialize the application with port and Atoma SDK
   * @param port - Port number for the server to listen on
   */
  constructor(port: string | number) {
    this.port = port;
    this.atoma = atomaSDK;
  }

  /**
   * Check the health status of the Atoma service
   * @private
   */
  private async health() {
    const data = await this.atoma.health.health();
    console.log(data);
  }

  /**
   * Start the HTTP server and initialize services
   */
  start() {
    const server = http.createServer(app);
    server.listen(this.port, () => {
      (async () => {
        await this.health();
      })();
      console.log(`server is listening on port ${this.port}`);
    });
  }
}

// Create and start the application
new Main(config.port).start();
