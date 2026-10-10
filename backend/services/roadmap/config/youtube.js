import dotenv from "dotenv"
dotenv.config()
import axios from "axios"


const BASE_URL = "https://www.googleapis.com/youtube/v3/search"


const searchVideo = async (topic) => {
    try {
        query = `${topic} tutorial`;
        let { data } = await axios.get(BASE_URL, {
            //parameters for the youtube api request
            params: {
                key: process.env.YOUTUBE_API_KEY,
                part: "snippet", //part = snippet means we want the video title, description, and other metadata, no need for the video content itself
                q: query, //q = query means we want to search for videos that match the query
                maxResults: 1, //maxResults = 1 means we only want the first result, we can change this to get more results if we want
                type: "video", //type = video means we only want videos, not channels or playlists
            },
        })

        if (data.items.length > 0) {
            const video = data.items[0];

            return {
                title: video.snippet.title,
                channel: video.snippet.channelTitle,
                url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
            };
        }

        return null

    } catch (error) {


        console.log(error)
        return null;

    }
}

export default searchVideo