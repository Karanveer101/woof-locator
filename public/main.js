const dogs = document.querySelectorAll(".dog");
const searchBtn = document.getElementById("searchBtn");
console.log(searchBtn);

//get dog details
dogs.forEach((dog) => {
    dog.addEventListener("click", async () => {
        const dogId = dog.id;
        console.log(dogId);
        //send the dog id to the server as a query for processing
        window.location.href = `/details?dogId=${dogId}`;
    });
});



