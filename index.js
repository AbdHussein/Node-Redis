const express = require('express');
const axios = require('axios');
const redis = require('redis');
const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.PORT || 6379;
const redisClient = redis.createClient(REDIS_PORT);
const app = express();

// Set Response
const setResponse = (username, numberOfRepos) => {
    return `<h2>${username} has ${numberOfRepos} GitHub repos</h2>`
}

//Make request to GitHub for data
const getReposNumber = async (req, res, next) => {
    try {
        console.log('Fetching Data...');
        const {username} = req.params;
        const response = await axios(`https://api.github.com/users/${username}`);
        const repos = response.data.public_repos;
        // Set data to Redis
        redisClient.setex(username, 3600, repos);
        res.send(setResponse(username, repos));
    } catch (error) {
      console.error(error);  
      res.status(500);
    }
}


// Cache middleware
const cache = (req, res, next) => {
    const {username} = req.params; 
    redisClient.get(username, (err, data) =>{
        if(err) throw err;
        if(data !== null) {
            res.send(setResponse(username, data));
        }else{
            next();
        }
    })
}

app.get('/repos/:username', cache, getReposNumber);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})