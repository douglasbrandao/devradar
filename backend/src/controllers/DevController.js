const axios = require("axios");
const Dev = require("../models/Dev");
const parseStringAsArray = require("../utils/parseStringAsArray");
const { findConnections, sendMessage } = require("../websocket");

class DevControler {
  async index(request, response) {
    const devs = await Dev.find();
    return response.json(devs);
  }

  async store(request, response) {
    const { github_username, techs, latitude, longitude } = request.body;

    let dev = await Dev.findOne({ github_username });

    if (dev) {
      return response.json({ message: "This user already exists" });
    }

    const apiResponse = await axios.get(
      `https://api.github.com/users/${github_username}`
    );

    const { name = login, avatar_url, bio } = apiResponse.data;

    const techsArray = parseStringAsArray(techs);

    const location = {
      type: "Point",
      coordinates: [longitude, latitude]
    };

    dev = await Dev.create({
      github_username,
      name,
      avatar_url,
      bio,
      techs: techsArray,
      location
    });

    const sendSocketMessageTo = findConnections(
      { latitude, longitude },
      techsArray
    );

    sendMessage(sendSocketMessageTo, "new-dev", dev);

    return response.json(dev);
  }

  async update(request, response) {
    const data = request.body;
    delete data.github_username;

    const techsArray = parseStringAsArray(data.techs);

    const dev = await Dev.findByIdAndUpdate(
      request.params.id,
      { ...data, techs: techsArray },
      {
        new: true
      }
    );

    return response.json(dev);
  }

  async destroy(request, response) {
    await Dev.findByIdAndDelete(request.params.id);
    return response.json({ message: "User deleted" });
  }
}

module.exports = new DevControler();
