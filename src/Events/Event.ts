import App from '../App'

class Event {
  public app

  constructor(app: App) {
    this.app = app

    this.register()
  }

  get client(): any {
    return this.app.client
  }

  get crewmate(): any {
    return this.app.crewmate
  }

  public register(): void {
    // ...
  }
}

export default Event
