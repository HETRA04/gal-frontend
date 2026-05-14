// js/testcentres.js — All UK DVSA driving test centres
const UK_TEST_CENTRES = [
  "Aberdeen North","Aberdeen South (Cove)","Aberfeldy","Abergavenny","Aberystwyth (Park Avenue)",
  "Airdrie","Alness","Alnwick","Arbroath","Ashfield","Ashford (Kent)","Ashford (London Middlesex)",
  "Atherton (Manchester)","Aylesbury","Ayr",
  "Bala","Ballater","Banbury","Banff","Bangor","Barking (Tanner Street)","Barnet (London)",
  "Barnsley","Barnstaple","Barrow In Furness","Barry","Basildon","Basingstoke","Bedford",
  "Belvedere (London)","Berwick-On-Tweed","Birmingham (Garretts Green)","Birmingham (Kings Heath)",
  "Birmingham (Kingstanding)","Birmingham (Shirley)","Birmingham (South Yardley)",
  "Birmingham (Sutton Coldfield)","Bishopbriggs","Bishops Stortford","Blackburn with Darwen",
  "Blackpool","Bletchley","Blyth","Bodmin","Bolton (Manchester)","Borehamwood (London)",
  "Boston","Bradford (Heaton)","Bradford (Thornbury)","Brecon","Bredbury (Manchester)",
  "Brentwood (London)","Bridgend","Bridlington","Bristol (Avonmouth)","Bristol (Kingswood)",
  "Bromley (London)","Buckie","Burgess Hill","Burton on Trent","Bury (Manchester)",
  "Bury St Edmunds","Buxton",
  "Camborne","Cambridge (Brookmount Court)","Campbeltown","Canterbury","Cardiff (Llanishen)",
  "Cardigan","Carlisle","Carmarthen","Castle Douglas","Chadderton","Cheetham Hill (Manchester)",
  "Chelmsford (Hanbury Road)","Cheltenham","Chertsey (London)","Chester","Chesterfield",
  "Chichester","Chingford (London)","Chippenham","Chorley","Clacton-on-Sea","Colchester",
  "Coventry","Crawley","Crewe","Crieff","Croydon (London)","Cumnock",
  "Darlington","Derby (Alvaston)","Doncaster","Dorchester","Dudley","Dumbarton","Dumfries",
  "Dundee","Dunoon","Duns","Durham",
  "East Kilbride","Eastbourne","Edinburgh (Currie)","Edinburgh (Musselburgh)","Elgin","Elswick",
  "Enfield (Innova Business Park)","Erith (London)","Exeter",
  "Farnborough","Featherstone","Folkestone","Forfar","Fort William","Fraserburgh",
  "Gairloch","Galashiels","Gateshead","Gillingham","Girvan","Glasgow (Anniesland)",
  "Glasgow (Baillieston)","Glasgow (Shieldhall)","Gloucester","Golspie","Goodmayes (London)",
  "Gosforth","Grangemouth","Grantham (Somerby)","Grantown-On-Spey","Greenock",
  "Grimsby Coldwater","Guildford",
  "Haddington","Halifax","Hamilton","Hartlepool","Hastings (Ore)","Hawick","Heckmondwike",
  "Hendon (London)","Hereford","Herne Bay","Hexham","Heysham","High Wycombe","Hinckley",
  "Hither Green (London)","Hornchurch (London)","Horsforth","Huddersfield","Hull","Huntly",
  "Hyde (Manchester)",
  "Inveraray","Inverness (Seafield Road)","Inverurie","Ipswich","Irvine","Islay Island",
  "Isle of Mull","Isle of Skye (Portree)","Isleworth (Fleming Way)",
  "Kelso","Kendal (Oxenholme Road)","Kettering","Kings Lynn","Kingussie","Kirkcaldy",
  "Knaresborough","Kyle of Lochalsh",
  "Lanark","Lancing","Launceston","Lee On The Solent","Leeds","Leicester (Cannock Street)",
  "Leicester (Wigston)","Leighton Buzzard (Stanbridge Road)","Lerwick","Letchworth","Lichfield",
  "Lincoln","Livingston","Llanelli","Llantrisant","Lochgilphead","Loughborough",
  "Loughton (London)","Louth","Lowestoft (Mobbs Way)","Ludlow","Luton",
  "Macclesfield","Maidstone","Mallaig","Malton","Melton Mowbray","Merthyr Tydfil",
  "Middlesbrough","Mill Hill (London)","Mitcham (London)","Monmouth","Montrose","Morden (London)",
  "Nelson","Newbury (Hambridge Lane)","Newport (Gwent)","Newton Abbot","Newton Stewart",
  "Newtown","Norris Green (Liverpool)","Northallerton","Northampton","Northwich",
  "Norwich (Jupiter Road)","Norwich (Peachman Way)","Nottingham (Chilwell)","Nuneaton",
  "Oban","Orkney","Oswestry","Oxford (Cowley)",
  "Paisley","Peebles","Pembroke Dock","Perth (Arran Road)","Peterborough","Peterhead",
  "Pinner (London)","Pitlochry","Plymouth","Pontefract","Poole","Portsmouth","Preston","Pwllheli",
  "Reading","Redditch","Redhill Aerodrome","Rhyl","Rochdale (Manchester)","Rotherham",
  "Rothesay","Rugby",
  "Sale (Manchester)","Salisbury","Scarborough","Scunthorpe","Sevenoaks",
  "Sheffield (Handsworth)","Sheffield (Middlewood Road)","Shrewsbury","Sidcup (London)",
  "Skegness","Skipton","Slough (London)","South Shields","Southall (London)",
  "Southampton (Forest Hills)","Southampton (Maybush)","Southend-on-Sea","St Albans",
  "Stafford","Steeton","Stevenage","Stirling","Stornoway","Stranraer","Sunderland",
  "Swansea","Swindon",
  "Taunton","Telford","Thurso","Tilbury","Tolworth (London)","Torfaen (Pontypool)",
  "Torquay","Tottenham (London)","Truro","Twickenham (London)",
  "Uig","Ullapool","Uxbridge (London)",
  "Wakefield","Walsall","Walthamstow (London)","Warrington","Watford","Wednesbury",
  "Wellingborough","Weston-Super-Mare","Weymouth","Whitby","Wigan (Manchester)",
  "Winchester","Witney","Woking","Wolverhampton","Worcester","Workington","Worthing",
  "Wrexham","Wythenshawe (Manchester)",
  "Yeovil","York"
].sort()

// Build a searchable select with autocomplete
function buildTestCentreSelect(elementId, selectedValue) {
  const el = document.getElementById(elementId)
  if (!el) return
  el.innerHTML = '<option value="">-- Select test centre --</option>'
    + UK_TEST_CENTRES.map(c =>
        '<option value="' + c + '"' + (c === selectedValue ? ' selected' : '') + '>' + c + '</option>'
      ).join('')
}

// Build a multi-select chip list (for instructors choosing multiple centres)
function buildTestCentreChips(containerId, selectedValues) {
  const el = document.getElementById(containerId)
  if (!el) return
  selected = selectedValues || []
  el.innerHTML = UK_TEST_CENTRES.map(c =>
    '<div class="chip' + (selected.includes(c) ? ' on' : '') + '" onclick="toggleCentre(this,\'' + c.replace(/'/g,"&#39;") + '\')">' + c + '</div>'
  ).join('')
}

function toggleCentre(el, name) { el.classList.toggle('on') }

function getSelectedCentres(containerId) {
  return [...document.querySelectorAll('#' + containerId + ' .chip.on')].map(c => c.textContent)
}
