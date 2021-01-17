# Crewmate
Discord bot that enhances your community's experience.
Made for my usecase, so you might need to tweak the code a little to make it work for you. Namely changing message contents so they're in your language.

## Setup
It requires a certain server layout, channel configuration and bot configuration.

Server layout: (c - category, v - voice channel, t - text channel, e.g. "c: Lobby #1" means category named "Lobby #1")
```
c: Main (enter name in the config file under "mainCategoryName")
  t: Lobby Status (enter name in the config file under "lobbyStatusChannelName"
```
Any number of instances of the following structure:

```
c: Lobby #N (where N is an unique integer)
  t: codes
  v: voice
```

Channel configuration:

Voice channels in each lobby should have a limit of users. Preferrably 10, since that's the size of Among Us lobbies.

## Features
Any of these can be disabled in the config file under `apps.AppName.enabled` by setting it to `false`.

### Among Us maps
Type `!mapa ___` in any text channel to get a map of the level. Replace blank with skeld, polus, mira. Aliases and picture links can be changed in the config file.

### Game codes
When you're in a voice channel (and by extension a game lobby - voice + text channels grouped by a category), type a 6 letter code in the `codes` text channel.

Crewmate will react to it with two flags (US and EU) corresponding to the Among Us region you're connected to.

Picking one of these reactions will put the game code and region in voice channel name.

Only the game lobby owner (the person that sent the code) can do this, other interactions will be ignored.

You can only do that in a game lobby category that you are connected to, others will not work. This is to prevent random people from setting their codes in your channel name, or random people picking the region for your code.

Now new people can join your Among Us lobby immediately without having to ask for the code ;)

### Reservations 
Type `!rezerwacja ____` in a text channel that belongs in your category to save the last voice slot for your buddy. Replace blank with their discord tag (@ them).
Reservation will be removed after they join your voice channel. You can also remove it manually by reacting with the X emoji under your initial reservation request. Only you can do that, it prevents random people from cancelling it and stealing the slot.

Reservation duration is configured under `apps.Reservations.timeout`.


## Deployment
Personally I run it on my desktop Raspberry Pi cluster running Kubernetes.
Included is a Dockerfile you can use to containerize the app.

