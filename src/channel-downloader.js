const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const util = require('util');
const colors = require('colors');
const exec = util.promisify(require('child_process').exec);

class ChannelDownloader {
	constructor (channelURL, format) {
		this.channelURL = channelURL;
		this.format = format;
		this.videos = [];
	}

	async getVideos () {
		console.log('Getting videos...')

		const options = new chrome.Options();
		options.addArguments('--no-sandbox')
				.addArguments('--headless=new')
				.addArguments('--start-maximized');

		const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

		try {
			await driver.get(this.channelURL);

			const popularButton = await driver.wait(until.elementLocated(By.css('#scroll-container > :first-child > :nth-child(2)')));
			await driver.actions({ async: true }).move({ origin: popularButton }).click().perform();

			const videos = await driver.wait(until.elementsLocated(By.css('#video-title-link')));

			await driver.actions({ async: true }).scroll(0, 0, 0, 10000);

			for (let video of videos) {
				let link = await video.getAttribute('href');
				let id;
				let title = await video.getAttribute('title');

				if (link !== null) {
					id = link.split('=')[1].split('&')[0];
				}

				this.videos.push({
					title,
					id,
				});
			}

			await driver.close();
			this.downloadVideos();
		} catch (error) {
			console.log(error);
		}
	}

	async downloadVideos () {
		const options = new chrome.Options();
		options.addArguments('--no-sandbox')
				.addArguments('--headless=new')
				.addArguments('--start-maximized');

		const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

		for (let video of this.videos) {
			await driver.switchTo().newWindow('tab');
			await driver.get(`https://tomp3.cc/youtube-downloader/${video.id}`);

			const processDownloadButton = await driver.wait(until.elementLocated(By.css('td:nth-child(3) > button')));
			await driver.actions().move({ origin: processDownloadButton }).click().perform();

			const downloadButton = await driver.wait(until.elementLocated(By.css('#btn-dl')), 20000);
			const link = await downloadButton.getAttribute('href');

			await driver.get(link);

			console.log(`${video.title} downloaded!`.green);
		}

		this.renameFiles();
	}

	async renameFiles () {
		await exec('for file in tomp3.cc\ -*; do mv "$file" "${file#tomp3.cc\ -}"; done');
	
		if (this.format !== 'mp4') {
			this.formatVideos();
		}
	}

	async formatVideos () {
		await exec('for file in *.mp4; do ffmpeg -i "$file" "$file.mpg"; done');
	}

	run () {
		this.getVideos();
	}
}

module.exports = ChannelDownloader;
