import axios from "axios";

export default async function getTrendingMindshareScore() {
    const response = await axios.get('https://finowl.finance/api/v0/fresh-mentions');
    if (response.status === 200) {
        return response.data;
    }
    return null;
}