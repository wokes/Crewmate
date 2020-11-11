import Crewmate from '../Crewmate'

import Event from './Event'

class Ready extends Event {
  public register(): void {
    this.client.on('ready', () => {
      this.handle()
    })
  }

  public handle(): void {
    this.init()
  }

  public async init(): Promise<void> {
    this.app.crewmate = new Crewmate(this.app)
  }
}

export default Ready
