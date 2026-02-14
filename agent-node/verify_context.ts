
import axios from 'axios';

const AGENT_URL = 'http://localhost:8002/chat';

async function testContext() {
    try {
        console.log("1. Sending casual greeting...");
        const res1 = await axios.post(AGENT_URL, {
            message: "Hi bestie! I bought a coffee today."
        });
        console.log("Agent response 1:", res1.data.response);

        console.log("2. Checking for friendly tone...");
        if (res1.data.response.includes("!") || res1.data.response.toLowerCase().includes("coffee")) {
            console.log("SUCCESS: Agent is friendly!");
        } else {
            console.error("FAILURE: Agent is still too formal.");
        }

    } catch (e) {
        console.error("Test failed. Is agent-node running on port 8002?", e.message);
    }
}

testContext();
