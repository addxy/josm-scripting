import request from 'request'
import queryOverpass from 'query-overpass'
import turf from 'turf'
import fs from 'fs'

/*
Helpful Documentation

https://ponyfoo.com/articles/understanding-javascript-async-await
https://hacks.mozilla.org/2015/04/es6-in-depth-iterators-and-the-for-of-loop/
*/

function latlngBbox(bbox) {
  return [bbox[1], bbox[0], bbox[3], bbox[2]]
}

function getTasks(project) {
  return new Promise((resolve, reject) => {
    request(`http://tasks.osmcanada.ca/project/${project}/tasks.json`, (error, response, body) => {
      resolve(JSON.parse(body))
    })
  })
}

function getFeatures(feature) {
  let bbox = latlngBbox(turf.extent(feature))
  let command = `[out:json];node(${bbox})["addr:housenumber"]["addr:street"]["addr:postcode"!~"."];out;`

  return new Promise((resolve, reject) => {
    queryOverpass(command, (error, geojson) => {
      console.log(geojson)
      exit()
      resolve(geojson)
    })
  })
}

function getPostal() {
  return new Promise((resolve, reject) => {
    fs.readFile('./data/postal_fsa.geojson', 'utf8', (error, data) => {
      resolve(JSON.parse(data))
    })
  })
}

async function crawl(project) {
  let tasks = await getTasks(project)
  let postal = await getPostal()

  for (var task of tasks['features']) {
    let features = await getFeatures(task)
    features = turf.tag(features, postal, 'CFSAUID', 'addr:postcode')
    console.log(features['features'][0])
    exit()
  }
}


crawl(20)
