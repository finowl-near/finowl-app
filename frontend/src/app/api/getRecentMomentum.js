import axios from "axios";

export default async function getRecentMomentum() {
    const response = await axios.get('https://finowl.finance/api/v0/recent-momentum');
    if (response.status === 200) {
        console.log("recent ")
        return response.data;
    }
    return null;
}