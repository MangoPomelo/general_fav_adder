// ==UserScript==
// @name         General Favoriates Adder
// @namespace    https://greasyfork.org/zh-CN/scripts/424020-general-favoriates-adder
// @version      0.25
// @description  General Favoriates Adder for pixiv.net or other websites
// @author       MangoPomelo
// @include      /^https?://safebooru\.org/index\.php.*id=.*$/
// @include      /^https?://www\.pixiv\.net/artworks/.*$/
// @include      /^https?://hitomi\.la/(doujinshi|gamecg|cg)/.*?\.html$/
// @include      /^https?://nozomi\.la/post/.*?\.html$/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let MODE = "PRODUCTION"; // "TUNNING" if want to tune the threshold and create new pattern, else use "PRODUCTION"
    let TEMPLATE = "{author}\t{URL}\t{character}\t{full_color}"; // placeholders must coresponding to the subjects in CONFIG
    let LIKE = "LIKE"; let COPIED = "COPIED"; // words displayed on the button
    let CONFIG = {
        "author": {
            "type": "is",
            "resultMap": res => res? res.replace(/@.+/, ""): "",
            "evaluations": [
                "#root > div:nth-child(2) > div.sc-1nr368f-0.kCKAFN > div > div.sc-1nr368f-3.iHKGIi > aside > section.sc-171jvz-1.sc-171jvz-3.sc-10r3j8-0.f30yhg-3.dfhJPe > h2 > div > div > a", // pixiv.net
                "#tag-sidebar > li.tag-type-artist.tag > a", // safebooru.org
                "body > div.container > div.content > div.gallery > h2", "body > div.container > div.content > div > div > table > tbody > tr:nth-child(1) > td:nth-child(2) > ul > li > a", // hitomi.la
                "body > div > div.sidebar > ul > li > a.artist", // nozomi.la
            ]
        },
        "URL": {
            "type": "is",
            "resultMap": x => window.location.href.replace(location.hash, "")
        },
        "character": {
            "type": "is",
            "ranker": {
                "threshold": 1,
                "patterns": [
                    {"reg": /^.*_.*$/, "weight": 5},
                    {"reg": /^.* .*$/, "weight": 3},
                    {"reg": /^.*\(.*\)$/, "weight": 15},
                    {"reg": /^.*・.*$/, "weight": 15},
                    {"reg": /^[ァ-ヴー]{4}$/u, "weight": 1},
                    {"reg": /^[ァ-ヴー]{2,3}$/u, "weight": 5},
                    {"reg": /^[ァ-ヴー]+$/u, "weight": 2},
                    {"reg": /^[一-龠ァ-ヴー]{2,5}$/u, "weight": 3},
                    {"reg": /^[一-龠]{3,4}$/u, "weight": 6},
                    {"reg": /^[一-龠]{1,3}[ァ-ヴーぁ-ゔ]{2,3}$/u, "weight": 4},
                ]
            },
            "evaluations": [
                "#root > div:nth-child(2) > div.sc-1nr368f-0.kCKAFN > div > div.sc-1nr368f-3.iHKGIi > main > section > div.sc-171jvz-0.ketmXG > div > figcaption > div.sc-1u8nu73-13.KzfRK > div > footer > ul > li > span > span:nth-child(1)", // pixiv.net
                "#tag-sidebar > li.tag-type-character.tag > a", // safebooru.org
                "body > div > div.content > div > div > table > tbody > tr:nth-child(5) > td:nth-child(2) > ul > li", // hitomi.la
                "body > div > div.sidebar > ul > li > a.character", // nozomi.la
            ]
        },
        "full_color": {
            "type": "has",
            "featureTags": ["Full Color"],
            "resultMap": res => (res || /.*(cg|post|artworks).*/.test(window.location.href))? "True": "False",
            "evaluations": [
                "#root > div:nth-child(2) > div.sc-1nr368f-0.kCKAFN > div > div.sc-1nr368f-3.iHKGIi > main > section > div.sc-171jvz-0.ketmXG > div > figcaption > div.sc-1u8nu73-13.KzfRK > div > footer > ul > li > span > span:nth-child(1)", // pixiv.net
                "#tag-sidebar > li.tag-type-general > a", // safebooru.org
                "body > div > div.content > div > div > table > tbody > tr > td:nth-child(2) > ul > li", // hitomi.la
                "body > div > div.sidebar > ul > li > a.general", // nozomi.la
            ]
        },
    };

    // Codes below

    class HasVerifier {
        constructor(subject) {
            this.dataLoaded = false;
            if (subject !== undefined) {
                // if subject exists
                this.setData(subject);
            }
        }
        setData(subject) {
            this.subject = subject;
            this.type = CONFIG[subject].type.toLowerCase();
            this.featureTags = CONFIG[subject].featureTags;
            this.resultMap = CONFIG[subject].resultMap? CONFIG[subject].resultMap: res => res? "true": "false";
            this.evaluations = CONFIG[subject].evaluations;

            if (this.type != 'has') {
                throw Error("<Class HasVerifier>: Only the type 'has' is accepted in HasVerifier, do you mean to use <Class IsVerifier>?")
            }

            this.dataLoaded = true;
            return this;
        }
        verify() {

            if (this.dataLoaded == false) {
                throw Error("<Class HasVerifier>: The configuration hasn't been loaded, use .setData(subj) to load the data")
            }

            let result = false;
            for (let selector of this.evaluations) {
                const candidates = document.querySelectorAll(selector);
                const tags =  [...candidates].map(elem => elem.innerText);
                const tagsToCheck = this.featureTags;
                for (let tag of tags) {
                    for (let tagToCheck of tagsToCheck) {
                        if (tag.includes(tagToCheck)) {
                            result = true;
                            return this.resultMap(result);
                        }
                    }
                }
            }
            return this.resultMap(result);
        }
    }

    class IsVerifier {
        constructor(subject) {
            this.dataLoaded = false;
            if (subject !== undefined) {
                // if subject exists
                this.setData(subject);
            }
        }
        setData(subject) {
            this.subject = subject;
            this.type = CONFIG[subject].type.toLowerCase();
            this.resultMap = CONFIG[subject].resultMap? CONFIG[subject].resultMap: res => res? res: "";
            this.evaluations = CONFIG[subject].evaluations? CONFIG[subject].evaluations: [];
            this.patterns = CONFIG[subject].ranker? CONFIG[subject].ranker.patterns? CONFIG[subject].ranker.patterns: [{"reg": /.*/, "weight": 1}]: [{"reg": /.*/, "weight": 1}];
            this.threshold = CONFIG[subject].ranker? CONFIG[subject].ranker.threshold? CONFIG[subject].ranker.threshold: 0: 0;

            if (this.type != 'is') {
                throw Error("<Class IsVerifier>: Only the type 'is' is accepted in IsVerifier, do you mean to use <Class HasVerifier>?")
            }

            this.dataLoaded = true;
            return this;
        }
        verify() {

            if (this.dataLoaded == false) {
                throw Error("<Class IsVerifier>: The configuration hasn't been loaded, use .setData(subj) to load the data")
            }

            let globalCandidates = [];
            for (let selector of this.evaluations) {
                const candidates = document.querySelectorAll(selector);
                const tags = [...candidates].map(elem => elem.innerText);
                globalCandidates = [...globalCandidates, ...tags];
            }

            let highestScore = -1;
            let correspondingCandidate = "";
            for (let candidate of globalCandidates) {
                if (MODE == "TUNNING") {
                    console.log(`${candidate}:`);
                }
                let score = 0;
                for (let pattern of this.patterns) {
                    let reg = pattern.reg;
                    if (reg.test(candidate)) {
                        score += pattern.weight;
                        if (MODE == "TUNNING") {
                            console.log(`  ${reg} +${pattern.weight}`);
                        }
                    }
                }
                if (score > highestScore) {
                    highestScore = score;
                    correspondingCandidate = candidate;
                }
                if (MODE == "TUNNING") {
                    console.log(`  (${score}/${this.threshold})`);
                }
            }
            return this.resultMap(highestScore >= this.threshold? correspondingCandidate: null);
        }
    }

    class Verifier {
        constructor(subject) {
            this.innerHasVerifier = new HasVerifier();
            this.innerIsVerifier = new IsVerifier();
            this.currentVerifier = null;

            this.dataLoaded = false;
            if (subject !== undefined) {
                // if subject exists
                this.setData(subject);
            }
        }
        setData(subject) {
            const type = CONFIG[subject].type.toLowerCase();
            if (type == 'is') {
                this.currentVerifier = this.innerIsVerifier;
            } else if (type == 'has') {
                this.currentVerifier = this.innerHasVerifier;
            } else {
                throw Error('<Class Verifier>: Type must be either "is" or "has"');
            }
            this.dataLoaded = true;
            this.currentVerifier.setData(subject);
            return this;
        }
        verify() {

            if (this.dataLoaded == false) {
                throw Error("<Class Verifier>: The configuration hasn't been loaded, use .setData(subj) to load the data")
            }

            return this.currentVerifier.verify();
        }
    }

    class Formatter {
        fill(pairs) {
            let newString = `${TEMPLATE}`;
            for (let subject in pairs) {
                let key = subject;
                let value = pairs[subject];
                newString = newString.replace("{" + key + "}", value);
            }
            return newString;
        }
    }

    const copyToClipboard = str => {
        const el = document.createElement('textarea');
        el.value = str;
        el.setAttribute('readonly', '');
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
    };

    const extract = (event) => {
        let elem = event.target;
        let v = new Verifier();
        let f = new Formatter();
        let pairs = {};
        for (let subject in CONFIG) {
            let value = v.setData(subject).verify();
            pairs[subject] = value;
        }
        let result = f.fill(pairs);
        copyToClipboard(result);
        elem.innerText = COPIED;

        elem.style.opacity = "0";
        setTimeout(()=>{
            elem.remove();
        }, 2500);
    };

    (()=>{
        let style = `
            <style>
            .add-to-fav {
            position: fixed;
            z-index: 9999;
            bottom: 20px;
            left: 20px;

            width: 80px;

            color: #494949 !important;
            text-decoration: none;
            background: #ffffff;
            padding: 6px;
            border: 4px solid #494949 !important;
            border-radius: 5px;
            display: inline-block;
            transition: all 0.4s ease 0s;
            }
            .add-to-fav:hover {
            color: #ffffff !important;
            background: #f6b93b;
            border-color: #f6b93b !important;
            transition: all 0.4s ease 0s;
            transition: opacity 2s ease 0s;
            }
            </style>
        `;
        document.getElementsByTagName('head')[0].insertAdjacentHTML('afterbegin', style);

        let element = `<button class="add-to-fav">${LIKE}</div>`;
        document.getElementsByTagName("body")[0].insertAdjacentHTML('afterbegin', element);
        document.getElementsByClassName("add-to-fav")[0].addEventListener("click", extract);
    })();
})();
