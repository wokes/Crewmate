import { createLogger, format, transports } from 'winston'
import App from '../App'

class Logger {
  public app: App
  public log: any

  constructor(app: App) {
    this.app = app
    this.log = createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp(),
        format.printf(({ level, message, timestamp }) => `${timestamp} ${level}: ${JSON.stringify(message)}`)
      ),
      transports: [
        new transports.Console({ level: 'silly' }),
        new transports.File({ filename: 'crewmate.log', level: 'silly' }),
        new transports.File({ filename: 'error.log', level: 'error' }),
      ]
    })

    this.register()
  }

  private register(): void {
    this.app.on('debug', (args) => {
      args = this.format(args)

      if (typeof args === 'string' && args.startsWith('Unhandled packet')) {
        return
      }

      this.log.debug(args)
    })

    this.app.on('info', (args) => {
      this.log.info(this.format(args))
    })

    this.app.on('warning', (args) => {
      this.log.warn(this.format(args))
    })

    this.app.on('error', (args) => {
      this.log.error(this.format(args))
    })
  }

  private format(args: any): any {
    if (args.length === 1) {
      args = args[0]
    }

    return args
  }
}

export default Logger
