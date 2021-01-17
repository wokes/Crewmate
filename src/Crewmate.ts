import Config from 'config'

import { CategoryChannel, Client, Guild, MessageEmbed, TextChannel, User, VoiceChannel } from 'discord.js'

import App from './App'

import * as Apps from './Apps'

class Crewmate {
  public app: App

  public guild: Guild
  public categories: any
  public textChannels: any
  public voiceChannels: any

  public mainCategory: CategoryChannel
  public lobbyStatusChannel: TextChannel

  public gameLobbyCategories: any
  public statusMessages: any
  public lastStatusMessage: Date

  public apps: any

  constructor(app: App) {
    this.app = app

    this.categories = []
    this.textChannels = []
    this.voiceChannels = []
    this.gameLobbyCategories = []

    this.apps = {}

    this.statusMessages = {
      empty: null,
      full: null,
      nonempty: null
    }

    this.init()
    this.registerApps()
  }

  public get client() : Client {
    return this.app.client
  }

  public async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  public isGameLobbyChannel(channel: TextChannel | VoiceChannel): boolean {
    return this.gameLobbyCategories.find(cat => cat.id === channel.parentID) !== undefined
  }

  public getVoiceChannelPairedWithTextChannel(textChannel: TextChannel) : VoiceChannel {
    return this.gameLobbyCategories.find(cat => cat.id === textChannel.parentID).voice
  }

  public getVoiceChannelUserCount(channel: VoiceChannel): number {
    return channel.members.array().length
  }

  public voiceChannelIsEmpty(channel: VoiceChannel): boolean {
    return this.getVoiceChannelUserCount(channel) === 0
  }

  public userIsInVoiceChannel(user: User, channel: VoiceChannel): boolean {
    return channel.members.get(user.id) !== undefined
  }

  public async purgeStatusMessages(): Promise<void> {
    await this.lobbyStatusChannel.bulkDelete(10)
    await this.sleep(2000)
  }

  public async updateStatusEmbeds(): Promise<void> {
    this.gameLobbyCategories.sort((a, b) => (a.position > b.position) ? 1 : -1)

    const lobbies = {
      empty: [],
      full: [],
      nonempty: []
    }

    this.gameLobbyCategories.forEach(cat => {
      const slotCount = cat.voice.userLimit
      const userCount = JSON.parse(JSON.stringify(cat.voice.members)).length
      const slotsAvailable = slotCount - userCount
      let isFull = slotsAvailable === 0

      // Fix for admins/mods joining full channels and them displaying as not full
      if (slotsAvailable < 0) {
        isFull = true
      }

      const emoji = isFull ? ':no_entry_sign:' : ':white_check_mark:'

      const embedFieldData = {
        name: `${emoji} ${this.categories.find(c => c.id === cat.id).name}:⠀⠀${userCount} / ${slotCount}`,
        value: isFull ? '⠀' : `[:arrow_forward: Dołącz :arrow_backward:](https://discord.gg/${cat.invite.code})\n⠀`
      }

      if (slotsAvailable === slotCount) {
        lobbies.empty.push(embedFieldData)
      } else if (isFull) {
        lobbies.full.push(embedFieldData)
      } else {
        lobbies.nonempty.push(embedFieldData)
      }
    })

    let embed = new MessageEmbed()
      .setTimestamp()
      .setTitle('Puste lobby:')
      .setColor('GREEN')
      .addFields(lobbies.empty)

    if (this.statusMessages.empty === null) {
      this.statusMessages.empty = await this.lobbyStatusChannel.send(embed)
    } else {
      await this.statusMessages.empty.edit(null, embed)
    }

    await this.sleep(2000)

    embed = new MessageEmbed()
      .setTimestamp()
      .setTitle('Pełne lobby:')
      .setColor('RED')
      .addFields(lobbies.full)

    if (this.statusMessages.full === null) {
      this.statusMessages.full = await this.lobbyStatusChannel.send(embed)
    } else {
      await this.statusMessages.full.edit(null, embed)
    }

    await this.sleep(2000)

    embed = new MessageEmbed()
      .setTimestamp()
      .setTitle('Szukają ekipy:')
      .setColor('YELLOW')
      .addFields(lobbies.nonempty)

    if (this.statusMessages.nonempty === null) {
      this.statusMessages.nonempty = await this.lobbyStatusChannel.send(embed)
    } else {
      await this.statusMessages.nonempty.edit(null, embed)
    }

    await this.sleep(2000)
  }

  public parseCommand(text: string): any {
    const isCommand = text.substr(0, 1) === '!'

    if (isCommand) {
      text = text.substr(1)
      const args = text.split(' ')
      const cmd = (args.splice(0, 1)).toString()

      return { isCommand, cmd, args }
    } else {
      return { isCommand: false }
    }
  }

  private async init(): Promise<void> {
    this.client.user.setActivity('Powered by Wojtex')

    await this.getGuild()
    this.getCategories()
    this.getChannels()

    await this.getGameLobbies()
    await this.purgeStatusMessages()
    await this.updateStatusEmbeds()

    this.client.on('debug', info => {
      this.app.emit('debug', info)
    })

    this.client.on('error', error => {
      this.app.emit('debug', error)
    })

    this.client.on('warning', warn => {
      this.app.emit('debug', warn)
    })

    this.client.on('rateLimit', rateLimit => {
      this.app.emit('warning', rateLimit)
    })
  }

  private async registerApps(): Promise<void> {
    if (!Config.has('apps')) {
      return
    }

    for (const appName in Apps) {
      if (Object.prototype.hasOwnProperty.call(Apps, appName)) {
        if (Config.has(`apps.${appName}`) && Config.apps[appName].enabled) {
          this.apps[appName] = new Apps[appName](this)
        }
      }
    }
  }

  private async getGuild(): Promise<void> {
    this.guild = await this.client.guilds.fetch(Config.guildId)
  }

  private getCategories(): void {
    this.categories = this.client.channels.cache.filter(ch => ch.type === 'category')

    this.mainCategory = this.categories.find(cat => cat.name.toLowerCase() === Config.mainCategoryName.toLowerCase())
  }

  private getChannels(): void {
    this.textChannels = this.client.channels.cache.filter(ch => ch.type === 'text')
    this.voiceChannels = this.client.channels.cache.filter(ch => ch.type === 'voice')

    this.lobbyStatusChannel = this.textChannels.find(ch => ch.name.toLowerCase() === Config.lobbyStatusChannelName.toLowerCase() && ch.parentID === this.mainCategory.id)
  }

  private async getGameLobbies(): Promise<void> {
    const categories = this.categories.filter(cat => cat.name.includes('Lobby #'))

    const promises = categories.map(async cat => {
      const voice = this.voiceChannels.find(ch => ch.parentID === cat.id)
      const invites = await voice.fetchInvites()

      let permInvite = invites.find(i => i.maxAge === 0 && i.inviter.id === this.client.user.id)

      if (!permInvite) {
        permInvite = await voice.createInvite({ maxAge: 0 })
      }

      this.gameLobbyCategories.push({
        id: cat.id,
        position: cat.rawPosition,
        number: Number(cat.name.replace('Lobby #', '')),
        voice,
        text: this.textChannels.find(ch => ch.parentID === cat.id),
        invite: permInvite
      })
    })

    await Promise.all(promises)
  }
}

export default Crewmate
