async function loadJsonData(filePath) {
	try {
		const response = await fetch(filePath)
		const jsonData = await response.json()

		// Convert numeric-only strings to their relevant type
		const parseValues = (obj) => {
			for (let key in obj) {
				if (typeof obj[key] === "string") {
					if (/^\d+$/.test(obj[key])) {
						obj[key] = parseInt(obj[key], 10) // Convert to integer
					} else if (/^\d+\.\d+$/.test(obj[key])) {
						obj[key] = parseFloat(obj[key]) // Convert to float
					}
				} else if (typeof obj[key] === "object" && obj[key] !== null) {
					parseValues(obj[key])
				}
			}
		}

		jsonData.forEach((item) => parseValues(item))
		return jsonData
	} catch (error) {
		console.error("Error loading JSON data:", error)
		return []
	}
}

let plantdata = []
loadJsonData("plantdata.json").then((data) => {
	plantdata = data
})

let plants = []

function spawnPlant(planttype) {
	const plant = plantdata.find((p) => p.type === planttype)
	if (plant) {
		plants.push({ ...plant, age: 0, health: plant._maxhealth, alive: true })
	} else {
		console.warn(`"${planttype}" not found.`)
	}
}

let environment = {
	resources: {
		substrate: {
			water: 500,
			nutrient: 500,
		},
		atmosphere: {
			co2: 500,
		},
	},
	light: {
		uv: 0.3,
		violet: 0.6,
		blue: 0.8,
		green: 1,
		yellow: 0.9,
		orange: 0.8,
		red: 0.7,
		ir: 0.5,
	},
}

let time = 0

function updateEnvironmentPanel() {
	const envPanel = document.querySelector(".envpanel")
	if (envPanel) {
		// Clear existing content added by this function
		envPanel.innerHTML = ""

		// Add heading for environment
		const envHeading = document.createElement("h3")
		envHeading.textContent = "Environment"
		envPanel.appendChild(envHeading)

		for (let category in environment.resources) {
			// Add category heading
			const categoryHeading = document.createElement("h4")
			categoryHeading.textContent =
				category.charAt(0).toUpperCase() + category.slice(1)
			categoryHeading.className = "infoheader"
			envPanel.appendChild(categoryHeading)

			for (let key in environment.resources[category]) {
				const keyDiv = document.createElement("div")
				keyDiv.className = `env-${key} infostat`
				keyDiv.textContent = `${key}: ${environment.resources[category][key]}`
				envPanel.appendChild(keyDiv)
			}
		}
	}
}

function updatePlantPanel() {
	const plantSection = document.querySelector(".plantsection")
	if (plantSection) {
		// Clear existing content added by this function
		plantSection.innerHTML = ""

		// Add heading for plants
		const plantsHeading = document.createElement("h3")
		plantsHeading.textContent = "Plants"
		plantSection.appendChild(plantsHeading)

		plants.forEach((plant, index) => {
			// Create a panel for each plant
			const plantPanel = document.createElement("div")
			plantPanel.className = "plantpanel infopanel" // Add both classes
			plantPanel.id = `plant-${index}` // Assign an ID based on the plant index
			plantSection.appendChild(plantPanel)

			// Add heading for the plant
			const plantHeading = document.createElement("h4")
			plantHeading.textContent = `${
				plant.type.charAt(0).toUpperCase() + plant.type.slice(1)
			} ${index + 1}`
			plantPanel.appendChild(plantHeading)

			// Add plant properties to the panel
			for (let key in plant) {
				if (typeof plant[key] !== "object" && !key.startsWith("_")) {
					const keyDiv = document.createElement("div")
					keyDiv.className = `plant-${key} infostat`
					keyDiv.textContent = `${
						key.charAt(0).toUpperCase() + key.slice(1)
					}: ${plant[key]}`
					plantPanel.appendChild(keyDiv)
				}
			}
		})
	}
}

function timeStep(numsteps) {
	//run each step
	for (let i = 0; i < numsteps; i++) {
		for (let plant of plants) {
			//check if plant is alive
			if (plant.alive == true) {
				//reset plant healthy status
				plant.healthy = true

				//check if inputs are available from environment
				for (let category in plant.input) {
					for (let key in plant.input[category]) {
						//create new environment resource if it doesn't exist
						if (!environment.resources[category][key]) {
							environment.resources[category][key] = 0
						}
						//check if plant will be healthy
						if (
							environment.resources[category][key] -
								plant.input[category][key] * plant.health <
							0
						) {
							plant.healthy = false
						}
					}
				}

				//if inputs are avilable do input/output
				if (plant.healthy == true) {
					//inputs
					for (let category in plant.input) {
						for (let key in plant.input[category]) {
							environment.resources[category][key] -=
								plant.input[category][key] * plant.health
						}
					}
					//outputs
					for (let category in plant.output) {
						for (let key in plant.output[category]) {
							//create new environment resource if it doesn't exist
							if (!environment.resources[category][key]) {
								environment.resources[category][key] = 0
							}

							environment.resources[category][key] +=
								plant.output[category][key] * plant.health
						}
					}
				}

				//adjust plant health based on healthy status
				if (plant.healthy == true) {
					plant.health += plant._healingrate
				} else {
					plant.health -= 1
				}

				//cap plant health
				if (plant.health >= plant._maxhealth) {
					plant.health = plant._maxhealth
				}

				//age plant
				plant.age++

				//kill plant if health reaches 0
				if (plant.health <= 0) {
					plant.alive = false
				}
			}

			if (plant.alive!=true){
				
			}
		}

		time++
	}
	updateEnvironmentPanel()
	updatePlantPanel()
}

updateEnvironmentPanel()
updatePlantPanel()

window.addEventListener("load", () => {
	setInterval(() => {
		timeStep(1)
	}, 1000)
})