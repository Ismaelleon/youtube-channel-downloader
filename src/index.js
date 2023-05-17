const readline = require('node:readline/promises');
const ChannelDownloader = require('./channel-downloader');
const { stdin: input, stdout: output } = require('node:process');

const rl = readline.createInterface({
	input,
	output,
});

async function main () {
	const channelURL = await rl.question('Insert a youtube channel link: ');
	const format = await rl.question('Select a video format (mp4/mpg): ');
	rl.close();
	
	const channelDownloader = new ChannelDownloader(channelURL, format);

	channelDownloader.run();
}

main();
