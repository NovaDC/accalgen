import ICAL from "https://unpkg.com/ical.js";

const genorator_url = "TODO"
const calcolor = '#108218'
const defaultyear = (new Date()).getFullYear()
const defaultlocation = 'Animal Forest'
const defaultcategories = ['BIRTHDAY']
const acwikiurlbase = "https://animalcrossing.fandom.com/wiki/"

function lstrip(string, strip = [" "]) {
    if (typeof strip == "string") strip = [strip]
    for (var i in strip) {
        const s = strip[i];
        while (string.startsWith(s)) {
            string = string.substr(s.length);
        }
    }
    return string
}
function rstrip(string, strip = [" "]) {
    if (typeof strip == "string") strip = [strip]
    for (var i in strip) {
        const s = strip[i];
        while (string.endsWith(s)) {
            string = string.substr(0, string.length - s.length);
        }
    }
    return string
}
function strip(string, strip = [" "]) {
    return rstrip(lstrip(string, strip), strip);
}

function cleanVillagerName(dirtyname){
    return strip(dirtyname, [" ", "-", "_", "'", '"', "`"]).toLowerCase();
}

async function fetchVillagers() {
    return await fetch('https://raw.githubusercontent.com/Norviah/animal-crossing/master/json/combined/Villagers.min.json').then((response) => {return response.json()}, (reason) => {return null})
}

function getSpecificVillagerObjs(vdata, name){
    const cvn = cleanVillagerName(name)
    var rough_results = vdata.filter((vobj) => (
        (
            "filename" in vobj &&
            cleanVillagerName(vobj["filename"]) == cvn
        ) ||
        (
            "name" in vobj &&
            cleanVillagerName(vobj["name"]) == cvn
        )  ||
        (
            "translations" in vobj &&
            cvn in Object.entries(vobj["translations"]).filter((kvp) => kvp[0] == "sourceSheet").map((kvp) => cleanVillagerName(kvp[1]))
        )
    ))
    var exact_results = rough_results.filter((vobj) => (
        (
            "filename" in vobj &&
            cleanVillagerName(vobj["filename"]) == name
        ) ||
        (
            "name" in vobj &&
            cleanVillagerName(vobj["name"]) == name
        )  ||
        (
            "translations" in vobj &&
            name in Object.entries(vobj["translations"]).filter((kvp) => kvp[0] == "sourceSheet").map((kvp) => cleanVillagerName(kvp[1]))
        )
    ))
    return exact_results && exact_results.length > 0 && exact_results.length >= rough_results.length ? exact_results : rough_results
}

function getVillagerBirthday(vobj, year = defaultyear) {
    var date = null
    if ("birthday" in vobj) {
        var montday = vobj["birthday"].split("/")
        date = new ICAL.Time({ year: year, month: parseInt(montday[0], 10), day: parseInt(montday[1], 10), isDate:true })
    }
    return date 
}

function getLangs(vobj){
    console.log(vobj)
    return "translations" in vobj ? Object.keys(vobj["translations"]).filter((lang) => lang != "plural" && lang != "sourceSheet") : []
}

function getVillagerName(vobj, lang){
    const langs = getLangs(vobj)
    return langs.includes(lang) ? vobj["translations"][lang] : null
}

function getAllVillagerNames(vdata, lang){
    return vdata.map((vobj) => getVillagerName(vobj, lang))
}

function getVillagerIcon(vobj) {
    return "iconImage" in vobj ? vobj["iconImage"] : null
}

function getVillagerNameColor(vobj) {
    return "nameColor" in vobj ? vobj["nameColor"] : null
}

function getVillagerBubbleColor(vobj) {
    return "bubbleColor" in vobj ? vobj["bubbleColor"] : null
}

function getVillagerURL(vobj) {
    const vnameUS = getVillagerName(vobj, "uSen")
    return vnameUS && acwikiurlbase ? acwikiurlbase + vnameUS : null
}

function makeCal(eves=[], calname = null, caldesc = null, catagories=defaultcategories) {
    const gentime = ICAL.Time.now()
    
    var cal = new ICAL.Component("vcalendar")
    
    cal.addPropertyWithValue('version', '2.0')
    cal.addPropertyWithValue('prodid', '-//NovaDC//Animal Crossing Calendar Generator//EN')
    cal.addPropertyWithValue('calscale', 'GREGORIAN')
    cal.addPropertyWithValue('url', genorator_url)
    cal.addPropertyWithValue('color', calcolor)
    cal.addPropertyWithValue('created', gentime)
    cal.addPropertyWithValue('last-modified', gentime)
    cal.addPropertyWithValue('categories', catagories.join(','))

    if (calname) {
        cal.addPropertyWithValue('name', calname)
        cal.addPropertyWithValue('x-wr-calname', calname)
    }

    if (caldesc) {
        cal.addPropertyWithValue('summary', caldesc)
        cal.addPropertyWithValue('x-wr-caldesc', caldesc)
        cal.addPropertyWithValue('description', caldesc)
    }
    else if (calname) {
        cal.addPropertyWithValue('summary', calname)
        cal.addPropertyWithValue('x-wr-caldesc', calname)
        cal.addPropertyWithValue('description', calname)
    }

    for (var eve of eves) {
        console.log(eve)
        if (eve) {
            cal.addSubcomponent(eve); console.log(eve.toString())
        }
    }

    return cal
}

function makeBirthday(allVill, villname, lang, reoccur = false, year = defaultyear, location = defaultlocation, catagories = defaultcategories, reocurrcount = null, reoccurruntil = null) {
    const gentime = ICAL.Time.now()

    const vills = getSpecificVillagerObjs(allVill, villname)
    if (!vills) return null;

    const vill = vills[0]
    console.log("VILL:")
    console.log(vill)
    const uid = getVillagerName(vill, 'id')
    const name = getVillagerName(vill, lang)
    const birthday = getVillagerBirthday(vill, year)
    const url = getVillagerURL(vill)
    const color = getVillagerBubbleColor(vill)
    const imageurl = getVillagerIcon(vill)

    if (!name || !uid || !birthday) return null;

    var eve = new ICAL.Component("vevent")
    
    eve.addPropertyWithValue('uid', `${uid}-birthday`)
    eve.addPropertyWithValue('created', gentime)
    eve.addPropertyWithValue('last-modified', gentime)
    
    eve.addPropertyWithValue('summary', `${name}'s Birthday`)
    eve.addPropertyWithValue('description', `${name}'s Birthday`)
    if (catagories && catagories.length > 0) eve.addPropertyWithValue('categories', catagories.join(','))
    if (color) eve.addPropertyWithValue('color', color)
    if (imageurl) {
        var imgprop = eve.addPropertyWithValue('image', imageurl)
        imgprop.setParameter('value', "URI")
        imgprop.setParameter('display', "BADGE,THUMBNAIL")
    }
    eve.addPropertyWithValue('url', url)
    eve.addPropertyWithValue('contact', location ? name : `${name}\\,${location}`)
    if (location) eve.addPropertyWithValue('location', location)

    var end = birthday.clone()
    end.adjust(1)
    eve.addPropertyWithValue('dtstart', birthday)
    eve.addPropertyWithValue('dtend', end)
    if (reoccur) {
        var rr = new ICAL.Recur({ freq: 'YEARLY' })
        if (reocurrcount && reocurrcount > 0) rr.addComponent('COUNT', `${reoccurrcount}`)
        if (reoccurruntil && reoccurruntil > 0) rr.addComponent('UNTIL', reoccurruntil instanceof ICAL.Time ? reoccurruntil.toString() : (reoccurruntil instanceof Date ? ICAL.fromJSDate(reoccurruntil) :ICAL.fromString(reoccurruntil)))
        eve.addPropertyWithValue('rrule', rr)
    }

    return eve
}

// thx https://stackoverflow.com/a/45831357
function savetxt(txt, fn, type='text/plain;charset=utf-8'){
    var blob = new Blob([txt], {type: type});
    
    if (globalThis.navigator && globalThis.navigator.msSaveOrOpenBlob) globalThis.navigator.msSaveOrOpenBlob(blob, fn);
    else{
        var a = document.createElement('a')
        a.style = "display:none"
        a.download = fn
        a.href = URL.createObjectURL(blob)
        a.type = type
        a.dataset.downloadurl = [type, a.download, a.href].join(':');
        
        var e = document.createEvent('MouseEvents');
        e.initEvent('click', true, false, globalThis, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        a.dispatchEvent(e);
    }
}

function saveCal(cal) {
    savetxt(cal.toString(), "accal.ics");
}

export default { fetchVillagers, getSpecificVillagerObjs, getVillagerBirthday, getLangs, getVillagerName, getVillagerIcon,getVillagerNameColor,getVillagerBubbleColor,getVillagerURL, makeCal, makeBirthday, saveCal, getAllVillagerNames, defaultlocation }
export { fetchVillagers, getSpecificVillagerObjs, getVillagerBirthday,getLangs,getVillagerName, getVillagerIcon,getVillagerNameColor,getVillagerBubbleColor,getVillagerURL,makeCal, makeBirthday, saveCal, getAllVillagerNames, defaultlocation }
globalThis.fetchVillagers = fetchVillagers
globalThis.getSpecificVillagerObjs = getSpecificVillagerObjs
globalThis.getVillagerBirthday = getVillagerBirthday
globalThis.getLangs = getLangs
globalThis.getVillagerName = getVillagerName
globalThis.getVillagerIcon = getVillagerIcon
globalThis.getVillagerNameColor = getVillagerNameColor
globalThis.getVillagerBubbleColor = getVillagerBubbleColor
globalThis.getVillagerURL = getVillagerURL
globalThis.makeCal  = makeCal
globalThis.makeBirthday = makeBirthday
globalThis.saveCal = saveCal
globalThis.getAllVillagerNames = getAllVillagerNames
globalThis.defaultlocation = defaultlocation
globalThis.defaultyear = defaultyear
globalThis.defaultcategories = defaultcategories