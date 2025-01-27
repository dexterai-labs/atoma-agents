import http from 'http';
import app from './app';
import atomaSDK, { isAtomaHealthy } from './config/atoma';
import config from './config/config';
import { AtomaSDK } from 'atoma-sdk';

/**
 * Service status enum
 */
export enum ServiceStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  DOWN = 'down',
}

/**
 * Main application class that initializes and starts the server
 */
class Main {
  private atoma: AtomaSDK;
  private port: string | number;
  private serviceStatus: ServiceStatus;
  private healthCheckInterval: NodeJS.Timeout | null;

  /**
   * Initialize the application with port and Atoma SDK
   * @param port - Port number for the server to listen on
   */
  constructor(port: string | number) {
    this.port = port;
    this.atoma = atomaSDK;
    this.serviceStatus = ServiceStatus.HEALTHY;
    this.healthCheckInterval = null;
  }

  /**
   * Check the health status of the Atoma service
   * @private
   */
  private async checkHealth() {
    const isHealthy = await isAtomaHealthy();
    const newStatus = isHealthy
      ? ServiceStatus.HEALTHY
      : ServiceStatus.DEGRADED;

    if (this.serviceStatus !== newStatus) {
      console.log(
        `Service status changed from ${this.serviceStatus} to ${newStatus}`,
      );
      this.serviceStatus = newStatus;
    }
  }

  /**
   * Start periodic health checks
   * @private
   */
  private startHealthChecks() {
    // Check health every minute
    this.healthCheckInterval = setInterval(() => {
      this.checkHealth().catch((error) => {
        console.error('Health check failed:', error);
        this.serviceStatus = ServiceStatus.DEGRADED;
      });
    }, 60000);
  }

  /**
   * Stop health checks
   * @private
   */
  private stopHealthChecks() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Get current service status
   */
  getServiceStatus(): ServiceStatus {
    return this.serviceStatus;
  }

  /**
   * Start the HTTP server and initialize services
   */
  async start() {
    const server = http.createServer(app);

    // Perform initial health check
    await this.checkHealth();
    this.startHealthChecks();

    // Graceful shutdown handler
    const shutdown = () => {
      console.log('Shutting down gracefully...');
      this.stopHealthChecks();
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    };

    // Handle shutdown signals
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    server.listen(this.port, () => {
      console.log(`Server is listening on port ${this.port}`);
      console.log(`Initial service status: ${this.serviceStatus}`);
    });
  }
}

// Create and start the application
const main = new Main(config.port);
main.start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

// Export for use in other modules
export const getServiceStatus = () => main.getServiceStatus();
