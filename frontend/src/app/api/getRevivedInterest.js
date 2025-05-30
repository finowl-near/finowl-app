import axios from "axios";

export default async function getRevivedInterest() {
    const response = await axios.get('https://finowl.finance/api/v0/revived-interest');
    if (response.status === 200) {
        return response.data;
    }
    return null;
}