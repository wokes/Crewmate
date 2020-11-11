import * as Config from 'config'
import { Client, Message, MessageReaction, TextChannel, User, VoiceChannel, VoiceState } from 'discord.js'

import Crewmate from '../Crewmate'

class GameCodes {
  public crewmate: Crewmate

  constructor(crewmate: Crewmate) {
    this.crewmate = crewmate

    this.client.on('message', (message: Message) => {
      this.handleMessage(message)
    })

    this.client.on('messageReactionAdd', (messageReaction: MessageReaction, user: User) => {
      this.handleReaction(messageReaction, user)
    })

    this.client.on('voiceStateUpdate', (oldMember: VoiceState, newMember: VoiceState) => {
      this.handleVoiceStateUpdate(oldMember, newMember)
    })
  }

  public get client(): Client {
    return this.crewmate.client
  }

  private async handleMessage(message: Message): Promise<void> {
    let text = message.toString().trim().toLowerCase()

    const channel = message.channel

    // Ignore DM/News channels
    if (!(channel instanceof TextChannel)) {
      return
    }

    if (this.crewmate.isGameLobbyChannel(channel) && this.isGameCode(text)) {
      text = text.toUpperCase()

      const voiceChannel = this.crewmate.getVoiceChannelPairedWithTextChannel(channel)

      if (!this.crewmate.voiceChannelIsEmpty(voiceChannel) && this.crewmate.userIsInVoiceChannel(message.author, voiceChannel)) {
        await message.react('🇺🇸')
        await this.crewmate.sleep(1000)
        await message.react('🇪🇺')
      }
    }
  }

  private async handleReaction(messageReaction: MessageReaction, user: User): Promise<void> {
    // Ignore self-reactions
    if (user.bot === true) {
      return
    }

    const message = messageReaction.message
    const channel = message.channel

    // Ignore DM/News channels
    if (!(channel instanceof TextChannel)) {
      return
    }

    const reaction = messageReaction.emoji.name

    if (!['🇺🇸', '🇪🇺'].includes(reaction)) {
      return
    }

    const voiceChannel = this.crewmate.getVoiceChannelPairedWithTextChannel(channel)

    if (user === message.author && !this.crewmate.voiceChannelIsEmpty(voiceChannel) && this.crewmate.userIsInVoiceChannel(user, voiceChannel)) {
      this.updateVoiceChannelName(voiceChannel, message.toString().trim().toUpperCase(), reaction === '🇺🇸' ? 'NA' : 'EU')
    }
  }

  private async handleVoiceStateUpdate(oldMember: VoiceState, newMember: VoiceState): Promise<void> {
    const userTag = oldMember.member.user.tag

    const oldChannel = oldMember.channel
    const from = oldChannel === null ? null : (oldChannel.parent === null ? oldChannel.name : oldChannel.parent.name)

    const newChannel = newMember.channel
    const to = newChannel === null ? null : (newChannel.parent === null ? newChannel.name : newChannel.parent.name)

    let how

    if (oldChannel === null && newChannel !== null) {
      how = 'joined'
    } else if (oldChannel !== null && newChannel === null) {
      how = 'left'
    }

    if ((oldChannel !== null && newChannel !== null) && oldChannel !== newChannel) {
      how = 'switched'
    }

    if (how === 'joined') {
      this.crewmate.app.emit('info', `${userTag} joined to channel ${to} (${this.crewmate.getVoiceChannelUserCount(newChannel)} users)`)
    } else if (how === 'left') {
      this.crewmate.app.emit('info', `${userTag} left from channel ${from} (${this.crewmate.getVoiceChannelUserCount(oldChannel)} users)`)
    } else if (how === 'switched') {
      this.crewmate.app.emit('info', `${userTag} switched from ${from} (${this.crewmate.getVoiceChannelUserCount(oldChannel)} users) to ${to} (${this.crewmate.getVoiceChannelUserCount(newChannel)} users)`)
    }

    if ((how === 'left' || how === 'switched') && this.crewmate.isGameLobbyChannel(oldChannel) && this.crewmate.voiceChannelIsEmpty(oldChannel)) {
      this.updateVoiceChannelName(oldChannel)
    }

    if (how) {
      await this.crewmate.updateStatusEmbeds()
    }
  }

  private async updateVoiceChannelName(channel: VoiceChannel, code?: string, region?: string): Promise<void> {
    const bits = ['voice']

    if (code) {
      bits.push(code)

      if (region) {
        bits.push(region)
      }
    }

    const name = bits.join('-')

    if (channel.name !== name) {
      this.crewmate.app.emit('info', `Changing ${channel.name} to ${name}`)
      await channel.edit({ name })
      await this.crewmate.sleep(2000)
    }
  }

  private isGameCode(text: string): boolean {
    text = text.toLowerCase()
    return text.length === 6 && /[a-z]{6}/.test(text)
  }
}

export default GameCodes
