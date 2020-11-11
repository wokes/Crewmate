import { VoiceState } from 'discord.js'

import Event from './Event'

class VoiceStateUpdate extends Event {
  public register(): void {
    this.client.on('voiceStateUpdate', (oldMember: VoiceState, newMember: VoiceState) => {
      this.handle(oldMember, newMember)
    })
  }

  public async handle(oldMember: VoiceState, newMember: VoiceState): Promise<void> {
    const userTag = oldMember.member.user

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
      this.crewmate.logVoice(`${userTag} joined to channel ${to} (${this.crewmate.getVoiceChannelUserCount(newChannel)} users)`)
    } else if (how === 'left') {
      this.crewmate.logVoice(`${userTag} left from channel ${from} (${this.crewmate.getVoiceChannelUserCount(oldChannel)} users)`)
    } else if (how === 'switched') {
      this.crewmate.logVoice(`${userTag} switched from ${from} (${this.crewmate.getVoiceChannelUserCount(oldChannel)} users) to ${to} (${this.crewmate.getVoiceChannelUserCount(newChannel)} users)`)
    }

    if ((how === 'left' || how === 'switched') && this.crewmate.isGameLobbyChannel(oldChannel) && this.crewmate.voiceChannelIsEmpty(oldChannel)) {
      this.crewmate.updateVoiceChannelName(oldChannel)
    }

    if (how) {
      await this.crewmate.updateStatusEmbeds()
    }
  }
}

export default VoiceStateUpdate
