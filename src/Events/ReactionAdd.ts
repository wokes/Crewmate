import { MessageReaction, User } from 'discord.js'

import Event from './Event'

class ReactionAdd extends Event {
  public register(): void {
    this.client.on('messageReactionAdd', (messageReaction: MessageReaction, user: User) => {
      this.handle(messageReaction, user)
    })
  }

  public async handle(messageReaction: MessageReaction, user: User): Promise<void> {
    // Ignore self-reactions
    if (user.bot === true) {
      return
    }

    const reaction = messageReaction.emoji.name

    if (!['🇺🇸', '🇪🇺'].includes(reaction)) {
      return
    }

    const message = messageReaction.message
    const voiceChannel = this.crewmate.getVoiceChannelPairedWithTextChannel(message.channel)

    if (user === message.author && !this.crewmate.voiceChannelIsEmpty(voiceChannel) && this.crewmate.userIsInVoiceChannel(user, voiceChannel)) {
      this.crewmate.updateVoiceChannelName(voiceChannel, message.toString().trim().toUpperCase(), reaction === '🇺🇸' ? 'NA' : 'EU')
    }
  }
}

export default ReactionAdd
