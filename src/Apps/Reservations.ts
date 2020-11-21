import * as Config from 'config'
import { Client, Message, MessageReaction, TextChannel, User, VoiceState } from 'discord.js'
import moment from 'moment'

import Crewmate from '../Crewmate'

class Reservations {
  public crewmate: Crewmate

  private reservations: Array<any>

  constructor(crewmate: Crewmate) {
    this.crewmate = crewmate

    this.reservations = []

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

  private handleMessage(message: Message): Promise<void> {
    const channel = message.channel

    // Ignore DM/News channels
    if (!(channel instanceof TextChannel)) {
      return
    }

    const { isCommand, cmd } = this.crewmate.parseCommand(message.toString().trim().toLowerCase())

    if (isCommand) {
      if (cmd === 'rezerwacja') {
        const voiceChannel = this.crewmate.getVoiceChannelPairedWithTextChannel(channel)

        const reservation = message.mentions.users.array()
          .filter(u => {
            const userIsInVoice = voiceChannel.members.array().find(m => m.id === u.id) !== undefined
            const userHasReservation = this.reservations.find(r => r.user.id === u.id)

            return u.bot === false && u.id !== message.author.id && !userIsInVoice && !userHasReservation
          })[0]

        if (!reservation) {
          message.reply('nie mogę wykonać tej rezerwacji.')
          return
        }

        message.reply(`rezerwuję miejsce dla ${reservation}. Rezerwacja wygasa ${moment().add(Config.apps.Reservations.timeout, 'seconds').format('DD-MM-YYYY HH:mm:ss')}. Kliknij reakcje aby anulować.`)
        message.react('❌')

        this.reservations.push({
          id: message.id,
          channel: message.channel,
          voiceChannel,
          user: reservation,
          timeout: setTimeout(() => {
            const r = this.reservations.find(r => r.id === message.id)
            if (r) {
              this.removeReservation(r)
              message.channel.send(`Rezerwacja dla ${reservation} wygasła.`)
            } else {
              console.log('reservation not found.')
            }
          }, Config.apps.Reservations.timeout * 1000)
        })
      }
    }
  }

  private handleReaction(messageReaction: MessageReaction, user: User): Promise<void> {
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

    if (messageReaction.emoji.name !== '❌') {
      return
    }

    const voiceChannel = this.crewmate.getVoiceChannelPairedWithTextChannel(channel)

    if (user === message.author && this.crewmate.userIsInVoiceChannel(user, voiceChannel)) {
      const reservation = this.reservations.find(r => r.id === message.id)

      this.removeReservation(reservation)
      channel.send(`Rezerwacja dla ${reservation.user} anulowana.`)
    }
  }

  private handleVoiceStateUpdate(oldMember: VoiceState, newMember: VoiceState): Promise<void> {
    const oldChannel = oldMember.channel
    const newChannel = newMember.channel

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
      if (newChannel.members.array().length === newChannel.userLimit) {
        const reservations = this.reservations.filter(r => r.voiceChannel.id === newChannel.id)

        if (reservations.length) {
          const r = reservations.find(r => r.user.id === newMember.member.id)
          if (r !== undefined && r.user.id === newMember.member.id) {
            this.removeReservation(r)
            r.channel.send(`Usuwam rezerwację dla ${r.user} bo dołączył do kanału.`)
          } else {
            reservations[0].channel.send(`${newMember.member} sorry, miejsce zarezerwowane dla: ${reservations.map(r => r.user).join(', ')}`)
            newMember.kick()
          }
        }
      }
    }
  }

  private removeReservation(reservation: any): void {
    const reservationIndex = this.reservations.findIndex(r => r.id === reservation.id)

    if (reservation) {
      clearTimeout(reservation.timeout)
      this.reservations.splice(reservationIndex, 1)
    }
  }
}

export default Reservations
