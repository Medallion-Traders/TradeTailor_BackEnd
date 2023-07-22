function convertUnixToUtc(unixTimestamp) {
    // Create a new Date object using the UNIX timestamp (multiply by 1000 to convert to milliseconds)
    const date = new Date(unixTimestamp * 1000);

    // Use the UTC methods to extract the UTC components
    const utcYear = date.getUTCFullYear();
    const utcMonth = date.getUTCMonth() + 1; // Months are zero-based, so add 1
    const utcDay = date.getUTCDate();
    const utcHours = date.getUTCHours();
    const utcMinutes = date.getUTCMinutes();
    const utcSeconds = date.getUTCSeconds();

    // Construct the UTC time string
    const utcTimeString = `${utcYear}-${utcMonth
        .toString()
        .padStart(2, "0")}-${utcDay.toString().padStart(2, "0")} ${utcHours
        .toString()
        .padStart(2, "0")}:${utcMinutes
        .toString()
        .padStart(2, "0")}:${utcSeconds.toString().padStart(2, "0")}`;

    // console.log(utcTimeString);
    return utcTimeString;
}

export default convertUnixToUtc;
