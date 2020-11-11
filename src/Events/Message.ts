import { Message as TextMessage, MessageAttachment } from 'discord.js'

import Event from './Event'

class Message extends Event {
  public register(): void {
    this.client.on('message', (message: TextMessage) => {
      this.handle(message)
    })
  }

  public async handle(message: TextMessage): Promise<void> {
    let text = message.toString().trim().toLowerCase()

    const isCommand = text.substr(0, 1) === '!'

    if (isCommand) {
      text = text.substr(1)
      const args = text.split(' ')
      const cmd = (args.splice(0, 1)).toString()

      console.log({ cmd, args })

      if (cmd === 'mapa') {
        const maps = [
          {
            aliases: ['skeld'],
            img: 'https://i.imgur.com/HCm2uLT.png'
          }, {
            aliases: ['polus'],
            img: 'https://i.imgur.com/PSdize0.png'
          }, {
            aliases: ['mira', 'mira hq', 'mira-hq'],
            img: 'https://i.imgur.com/KPQJB8r.png'
          }
        ]

        const map = maps.find(m => m.aliases.includes(args[0].toLowerCase()))

        if (map === undefined) {
          message.reply('nie znaleziono mapy o takiej nazwie. Dostępne mapy: skeld, mira, polus')
        } else {
          message.reply(new MessageAttachment(map.img))
        }
      }

    } else if (this.crewmate.isGameLobbyChannel(message.channel) && this.crewmate.looksLikeGameCode(text)) {
      text = text.toUpperCase()

      const voiceChannel = this.crewmate.getVoiceChannelPairedWithTextChannel(message.channel, text)

      if (!this.crewmate.voiceChannelIsEmpty(voiceChannel) && this.crewmate.userIsInVoiceChannel(message.author, voiceChannel)) {
        await message.react('🇺🇸')
        await this.crewmate.sleep(1000)
        await message.react('🇪🇺')
      }
    }
  }
}

export default Message
