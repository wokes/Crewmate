import * as Config from 'config'
import { Client, Message, MessageAttachment } from 'discord.js'

import Crewmate from '../Crewmate'

class Maps {
  public crewmate: Crewmate

  private maps: any
  private mapNames: Array<string>

  constructor(crewmate: Crewmate) {
    this.crewmate = crewmate

    this.maps = Config.apps.Maps.data
    this.mapNames = this.maps.map(m => m.aliases[0])

    this.client.on('message', (message: Message) => {
      this.handleMessage(message)
    })
  }

  public get client(): Client {
    return this.crewmate.client
  }

  private async handleMessage(message: Message): Promise<void> {
    const { isCommand, cmd, args } = this.crewmate.parseCommand(message.toString().trim().toLowerCase())

    if (isCommand) {
      if (cmd === 'mapa') {
        const map = this.maps.find(m => m.aliases.includes(args[0].toLowerCase()))

        if (map === undefined) {
          message.reply(`nie znaleziono mapy o takiej nazwie.\nDostępne mapy: ${this.mapNames.join(', ')}`)
        } else {
          message.reply(new MessageAttachment(map.img))
        }
      }
    }
  }
}

export default Maps
