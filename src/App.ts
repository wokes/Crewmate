import * as Config from 'config'
import { Client } from 'discord.js'

import EventEmitter from './Utils/EventEmitter'
import Logger from './Utils/Logger'

import Crewmate from './Crewmate'
import * as Events from './Events'

// import { ChatCommands, DiscordFeeds, GroupAnnouncements, LinkWarnings } from './Apps'

class App extends EventEmitter {
  public client: Client
  public crewmate: Crewmate

  public events: any
  public utilities: any

  constructor() {
    super()

    this.client = new Client()

    this.utilities = {}
    this.events = {}

    this.registerEvents()
    this.registerUtilities()

    /**
     * Gracefully handle closing the program
     * Log out before exiting the process
     */
    process.on('SIGINT', async() => {
      process.exit()
    })

    this.client.login(Config.token)
  }


  private registerEvents(): void {
    for (const Event of Object.values(Events)) {
      if (Event !== Events.Event) {
        this.events[Event.name] = new Event(this)
      }
    }
  }

  private registerUtilities(): void {
    /**
     * Captures debug, warning and error events
     * Prints them in console and save log files
     */
    this.utilities.logger = new Logger(this)
  }
}

export default App
