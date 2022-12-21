
# 🐝 BeeDayBot 🐝

A discord bot that helps users celebrate their birthdays.

## About The Project

This is a personal project I built with the aim of helping my friends celebrate their birthdays in our discord server. The main goal of this project was to develop and deploy a discord bot that could track everyones birthdays in a database and automatically announce them on their respective days whilst also learning discord.js and MongoDB.

## Built With
- [Node.js](https://nodejs.org/en/)
- [discord.js](https://discord.js.org/#/)
- [MongoDB](https://www.mongodb.com/home)

## Features

- Tracks user birthdays
  - Users can add their birthday for BeeDayBot to track
  - Users can check their birthday tracked by BeeDayBot
  - BeeDayBot checks for birthdays everyday at midnight and announces them

- Leapling preferences
  - [Leaplings](https://www.dictionary.com/browse/leapling) can choose to have their birthdays announced on either the **28th of February** or **1st of March** during **non-leap years**

## Current Limitations

- BeeDayBot can only announce birthdays in one channel specified by `CHANNEL_ID` in `.env`
    - By extension this means BeeDayBot can only announce birthdays in one server at a time since `CHANNEL_ID` is unique
- BeeDayBot only announces birthdays according to the **IANA Australia/Sydney** time zone

## License

Distributed under the MIT License. See `LICENSE.md` for more information.

