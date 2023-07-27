const express = require("express");
const path = require("path");
const app = express();
const axios = require("axios");
require("dotenv").config();
const bodyParser = require("body-parser");

//set up public folder path for static files
app.use(express.static(path.join(__dirname, "public")));

// Set up Pug as the view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

// Set up body-parser middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));

// Define routes
app.get("/", async (req, res) => {
    const data = await getDogs();
    const breeds = await getBreeds();
    console.log(data);
    res.render("home", { data, breeds });
});

app.get("/details", async (req, res) => {
    const dogId = req.query.dogId;
    console.log("the dog id is:", dogId);
    const dogDetails = await getSingleDog(dogId);
    const location = dogDetails.contact.address.postcode;
    const photos = dogDetails.photos;
    console.log(photos);
    console.log("The dog's postal code is " + location);
    const staticMap = await getStaticMap(location);
    console.log(dogDetails);
    res.render("details", { photos, dogDetails, staticMap });
});

let locationInput;
let distanceInput;
app.post("/search", async (req, res) => {
    //get accessToken
    const accessToken = await getAccessToken();
    const breeds = await getBreeds();
    locationInput = req.body.location;
    distanceInput = req.body.distance;

    console.log(
        "The location and distance are " + locationInput,
        distanceInput
    );

    //display search results
    try {
        const url = `https://api.petfinder.com/v2/animals?type=dog&location=${locationInput}&distance=${distanceInput}`;
        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        if (response.status === 200) {
            const searchResult = response.data.animals;
            console.log(searchResult);
            res.render("home", { searchResult, breeds });
        } else {
            throw new Error("Unable to get dogs");
        }
    } catch (error) {
        throw new Error(`Error retrieving dogs: ${error.message}`);
    }
});

let breedInput;
app.post("/", async (req, res) => {
    const accessToken = await getAccessToken();
    const breeds = await getBreeds();
    breedInput = req.body.breed;
    console.log(
        "The location, distance, and breed input are " + locationInput,
        distanceInput,
        breedInput
    );
    try {
        // Make the API request
        const baseApiUrl = `https://api.petfinder.com/v2/animals?type=dog`;

        // Build the URL with query parameters based on the provided inputs
        const queryParams = [];
        if (locationInput) {
            queryParams.push(`location=${encodeURIComponent(locationInput)}`);
        }
        if (distanceInput) {
            queryParams.push(`distance=${encodeURIComponent(distanceInput)}`);
        }
        if (breedInput) {
            queryParams.push(`breed=${encodeURIComponent(breedInput)}`);
        }

        // Append the query parameters to the base URL
        let url = `${baseApiUrl}`;
        if (queryParams.length > 0) {
            url += `&${queryParams.join("&")}`;
        }

        console.log(url);
        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (response.status === 200) {
            const searchResult = response.data.animals;
            console.log(searchResult);
            res.render("home", { searchResult, breeds });
        } else {
            throw new Error("Unable to get results by search");
        }
    } catch (error) {
        console.error("Error retrieving search results:", error.message);
        res.status(500).send("Error retrieving search results.");
    }
});

// Start the server and listen on a specific port
const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

//request access token from petfinder

async function getAccessToken() {
    try {
        const response = await axios.post(
            "https://api.petfinder.com/v2/oauth2/token",
            {
                grant_type: "client_credentials",
                client_id: "L6Ix2hupFCCPj2VUmGPzcrPoyfw2B4WZ3C0YDlRb71sl9ftgfQ",
                client_secret: "XrAsPEGrcc0mkSb3ujEZV7ceRHvMnFH2bYJUjUsl",
            }
        );

        if (response.status === 200) {
            const accessToken = response.data.access_token;
            console.log(accessToken);
            return accessToken;
        } else {
            throw new Error("Unable to get access token");
        }
    } catch (error) {
        throw new Error(`Error retrieving access token: ${error.message}`);
    }
}

//GET request from petfinder, default dogs to display on initial request
async function getDogs() {
    //get access token
    const accessToken = await getAccessToken();

    //make a get request
    try {
        const url = `https://api.petfinder.com/v2/animals?type=dog&location=ON`;
        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        if (response.status === 200) {
            const dogInfo = response.data;
            console.log(dogInfo);
            return dogInfo.animals;
        } else {
            throw new Error("Unable to get dogs");
        }
    } catch (error) {
        throw new Error(`Error retrieving dogs: ${error.message}`);
    }
}

//GET request to get more information on a specific dog
async function getSingleDog(dogId) {
    //get access token
    const accessToken = await getAccessToken();

    //make a get request
    try {
        const url = `https://api.petfinder.com/v2/animals/${dogId}`;
        console.log(url);
        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        if (response.status === 200) {
            const dogInfo = response.data.animal;
            console.log(dogInfo);
            return dogInfo;
        } else {
            throw new Error("Unable to get dogInfo");
        }
    } catch (error) {
        throw new Error(`Error retrieving dogInfo: ${error.message}`);
    }
}

//GET Request: Static Map Api
async function getStaticMap(location) {
    const apiKey = process.env.STATIC_MAP_API;

    //make a get request
    try {
        const url = `https://maps.googleapis.com/maps/api/staticmap?center=${location}&zoom=14&size=400x400&key=${apiKey}`;
        const response = await axios.get(url);
        if (response.status === 200 && location === null) {
            console.log("address does not exist");
            return;
        } else if (response.status === 200) {
            console.log(response);
            console.log(url);
            return url;
        } else {
            throw new Error("Unable to get static map");
        }
    } catch (error) {
        throw new Error(`Error retrieving static map: ${error.message}`);
    }
}

//GET all possible dog breeds
async function getBreeds() {
    //get access token
    const accessToken = await getAccessToken();

    //make a get request
    try {
        const url = `https://api.petfinder.com/v2/types/dog/breeds`;
        console.log(url);
        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        if (response.status === 200) {
            const breeds = response.data.breeds;
            console.log(breeds);
            return breeds;
        } else {
            throw new Error("Unable to get dog breed");
        }
    } catch (error) {
        throw new Error(`Error retrieving dog breeds: ${error.message}`);
    }
}
