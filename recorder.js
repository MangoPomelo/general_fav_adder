// ==UserScript==
// @name         General Favoriates Adder
// @namespace    https://greasyfork.org/zh-CN/scripts/424020-general-favoriates-adder
// @version      0.21.4.3
// @description  General Favoriates Adder for pixiv.net or other websites
// @author       MangoPomelo
// @include      /^https?://safebooru\.org/index\.php.*id=.*$/
// @include      /^https?://www\.pixiv\.net/artworks/.*$/
// @include      /^https?://hitomi\.la/(doujinshi|gamecg|cg|manga)/.*?\.html$/
// @include      /^https?://nozomi\.la/post/.*?\.html$/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let MODE = "PRODUCTION"; // "TUNNING" if want to tune the threshold and create new pattern, else use "PRODUCTION"
    let TEMPLATE = "{author}\t{URL}\t{character}\t{full_color}"; // placeholders must coresponding to the subjects in CONFIG
    let BUTTON = `
        <div class="btn-circle-extract">
            <svg id="extract" viewBox="0 0 1119 1024" width="24px" height="20px" transform="translate(-4 -1)">
                <path d="M845.549139 525.561219c-12.281859 0-23.54023-5.117441-32.751624-13.305347a46.952524 46.952524 0 0 1 0-66.526737l182.18091-183.204397-182.18091-182.18091c-18.422789-18.422789-18.422789-48.103948 0-66.526737s48.103948-18.422789 66.526737 0l214.932534 215.956022a46.952524 46.952524 0 0 1 0 66.526737L879.324252 512.255872a51.878061 51.878061 0 0 1-33.775113 13.305347zM47.2283 1024h-4.093953c-25.587206-2.046977-45.033483-25.587206-42.986507-51.174413 26.610695-284.529735 131.006497-496.391804 313.187406-627.398301 315.234383-227.214393 741.005497-132.029985 758.404798-127.936032 25.587206 5.117441 40.93953 30.704648 34.798601 56.291854-5.117441 24.563718-30.704648 40.93953-56.291854 34.798601-3.070465-1.023488-402.230885-89.043478-682.666667 113.607197-158.64068 114.630685-250.754623 302.952524-273.271364 558.824587C91.238295 1005.577211 70.76853 1024 47.2283 1024z" fill="#9098A9"></path>
            </svg>
            <svg id="check" width="21px" height="15px" viewBox="13 17 21 15">
                <polyline points="32.5 18.5 20 31 14.5 25.5"></polyline>
            </svg>
            <svg id="border" width="48px" height="48px" viewBox="0 0 48 48">
                <path d="M24,1 L24,1 L24,1 C36.7025492,1 47,11.2974508 47,24 L47,24 L47,24 C47,36.7025492 36.7025492,47 24,47 L24,47 L24,47 C11.2974508,47 1,36.7025492 1,24 L1,24 L1,24 C1,11.2974508 11.2974508,1 24,1 L24,1 Z"></path>
            </svg>
        </div>
    `;
    let MAIN_COLOR = "#56dbfb";
    let STYLE = `
        <style>
            /* https://dribbble.com/shots/4525196-Jelly-Download */
            .btn-circle-extract {
                position: fixed;
                bottom: 32px;
                left: 28px;
                height: 48px;
                width: 48px;
                margin: auto;
                border-radius: 100%;
                background: #E8EAED;
                cursor: pointer;
                opacity: 0.88;
                overflow: hidden;
                transition: all 0.2s ease;
                transition: bottom 1s ease;
                z-index: 999;
            }

            .btn-circle-extract:after {
                content: "";
                position: relative;
                display: block;
                width: 200%;
                height: 100%;
                background-image: linear-gradient(100deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0));
                transform: translateX(-100%);
            }

            .btn-circle-extract svg {
                stroke-width: 2;
                stroke-linecap: round;
                stroke-linejoin: round;
                fill: none;
            }

            .btn-circle-extract svg#border {
                position: absolute;
                top: 0;
                left: 0;
                stroke: none;
                stroke-dasharray: 144;
                stroke-dashoffset: 144;
                transition: all 0.9s linear;
            }

            .btn-circle-extract svg#extract {
                position: absolute;
                top: 14px;
                left: 17px;
                stroke: #9098A9;
                transition: all 0.2s ease;
            }

            .btn-circle-extract svg#check {
                position: absolute;
                top: 17px;
                left: 13px;
                stroke: white;
                transform: scale(0);
            }

            .btn-circle-extract:hover {
                background: rgba(0, 119, 255, 0.2);
            }

            .btn-circle-extract:hover #extract path,
            .btn-circle-extract:hover #extract polyline {
                stroke: ${MAIN_COLOR};
            }

            .btn-circle-extract.load {
                background: rgba(0, 119, 255, 0.2);
            }

            .btn-circle-extract.load #extract path,
            .btn-circle-extract.load #extract polyline {
                stroke: ${MAIN_COLOR};
            }

            .btn-circle-extract.load #border {
                stroke: #56dbfb;
                stroke-dasharray: 144;
                stroke-dashoffset: 0;
            }

            .btn-circle-extract.done {
                background: ${MAIN_COLOR};
                animation: rubberBand 0.8s;
            }

            .btn-circle-extract.done:after {
                transform: translateX(50%);
                transition: transform 0.4s ease;
                transition-delay: 0.7s;
            }

            .btn-circle-extract.done #border,
            .btn-circle-extract.done #extract {
                display: none;
            }

            .btn-circle-extract.done #check {
                transform: scale(1);
                transition: all 0.2s ease;
                transition-delay: 0.2s;
            }

            @keyframes rubberBand {
                from {
                    transform: scale(1, 1, 1);
                }

                30% {
                    transform: scale3d(1.15, 0.75, 1);
                }

                40% {
                    transform: scale3d(0.75, 1.15, 1);
                }

                50% {
                    transform: scale3d(1.1, 0.85, 1);
                }

                65% {
                    transform: scale3d(0.95, 1.05, 1);
                }

                75% {
                    transform: scale3d(1.05, 0.95, 1);
                }

                to {
                    transform: scale3d(1, 1, 1);
                }
            }
        </style>
    `;
    let CALLBACK = () => {
        document.querySelector(".btn-circle-extract").onclick = function() {
            this.classList.add("load");
            setTimeout(function() {
                document.querySelector(".btn-circle-extract").classList.add("done");
            }, 1000);
        };
    };
    let CONFIG = {
        "author": {
            "type": "is",
            "resultMap": res => res? res.replace(/@.+/, ""): "",
            "evaluations": [
                "#root > div:nth-child(2) > div.sc-1nr368f-0.kCKAFN > div > div.sc-1nr368f-3.iHKGIi > aside > section.sc-171jvz-1.sc-171jvz-3.sc-10r3j8-0.f30yhg-3.dfhJPe > h2 > div > div > a > div:nth-child(1)", // pixiv.net
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
                "threshold": 0,
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
                    {"reg": /^[一-龠]{1,3}[ァ-ヴーぁ-ゔ]{2,3}$/u, "weight": 5},
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
        }
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
            // TODO: use destruction
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

    const extract = () => {
        let elem = document.querySelector(".btn-circle-extract");
        let v = new Verifier();
        let f = new Formatter();
        let pairs = {};
        for (let subject in CONFIG) {
            let value = v.setData(subject).verify();
            pairs[subject] = value;
        }
        let result = f.fill(pairs);
        copyToClipboard(result);

        setTimeout(()=>{
            elem.style.bottom = "-200px";
        }, 3000);
        setTimeout(()=>{
            elem.remove();
        }, 5000);
    };

    (()=>{
        document.querySelector('head').insertAdjacentHTML('afterbegin', STYLE);
        document.querySelector("body").insertAdjacentHTML('afterbegin', BUTTON);
        document.querySelector(".btn-circle-extract").addEventListener("click", extract);
        if (CALLBACK !== undefined) {
            CALLBACK();
        }
    })();

})();
