/*let promise = fetch('https://api-covid19.rnbo.gov.ua/data?to=2020-03-06')
	.then(response => response.json()); */

let ua, world;
const uaElem = document.querySelector('#ukraine .table_body');
const worldElem = document.querySelector('#world .table_body');


Date.prototype.toDateInputValue = (function() {
	let local = new Date(this);
	local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
	return local.toJSON().slice(0,10);
});

let elemDate = document.getElementById('date-picker');
let todayDate = new Date().toDateInputValue();
elemDate.value = todayDate;
elemDate.setAttribute('max', todayDate);

elemDate.addEventListener('change', (event) => {
	const chooseDate = event.target.value;
	dataOutput(chooseDate);
});
const getAPI = async(choosenDate = todayDate) => {
	const url = `https://api-covid19.rnbo.gov.ua/data?to=${choosenDate}`;
	const response = await fetch(url);
	const result = await response.json();
	return result;
}

/*
const getData = () => {
	let obj = getAPI()
		.then(e => {
			let ua = e.ukraine;
			let world = e.world;

			const uaElem = document.querySelector('#ukraine .table_body');
			const worldElem = document.querySelector('#world .table_body');

			uaElem.textContent = ua[0].confirmed;
			worldElem.textContent = world[0].confirmed;
			
			console.log(world);

			return [ua, world];
		});
}
*/
const htmlGenerate = (region) => {
	let resultTable = ``;

	for(let row = 0; row < region.length; row++){
		resultTable += `<tr class="table_row">`;
		resultTable += `<td class="table_cell">${region[row].region}</td>`;
		resultTable += `<td class="table_cell">${region[row].confirmed}</td>`;
		resultTable += `<td class="table_cell">${region[row].death}</td>`;
		resultTable += `<td class="table_cell">${region[row].recovered}</td>`;
		resultTable += `</tr>`;
	}
	return resultTable;
}

const dataOutput = async (chooseDate) => {
	const result = await getAPI(chooseDate);
	ua = result.ukraine.map((elem) => {
		return {'region': elem.label.uk, 'confirmed': elem.confirmed, 'death': elem.deaths, 'recovered': elem.recovered}
	});
	world = result.world.map((elem) => {
		return {'region': elem.label.uk, 'confirmed': elem.confirmed, 'death': elem.deaths, 'recovered': elem.recovered}
	});
	uaElem.innerHTML = htmlGenerate(ua);
	worldElem.innerHTML = htmlGenerate(world);
	barchartOutput();
}

dataOutput();

 const tabs = () => {
	let elemTabs = document.querySelector('.tabs');
	let eventTabShow;

	const showTab = (tabsLinkTarget) => {
		let tabsPaneTarget, tabsLinkActive, tabsPaneShow;

		tabsPaneTarget = document.querySelector(tabsLinkTarget.getAttribute('href'));
		tabsLinkActive = tabsLinkTarget.parentElement.querySelector('.active');
		tabsPaneShow = tabsPaneTarget.parentElement.querySelector('.tabs_pane_show');
		if (tabsLinkTarget === tabsLinkActive) {
			return;
		}
		if (tabsLinkActive !== null) {
			tabsLinkActive.classList.remove('active');
		}
		if (tabsPaneShow !== null) {
			tabsPaneShow.classList.remove('tabs_pane_show');
		}
		tabsLinkTarget.classList.add('active');
		tabsPaneTarget.classList.add('tabs_pane_show');
		console.log(tabsPaneShow.id);
		if(tabsPaneShow.id === 'ukraine' ){
			if(document.querySelector('#ukraine .sort-active') !== null){
				document.querySelector('#ukraine .sort-active').classList.remove('sort-active');
			}
		} else {
			if(document.querySelector('#world .sort-active') !== null){
				document.querySelector('#world .sort-active').classList.remove('sort-active');
			}
		}
		
	};

	elemTabs.addEventListener('click', (e) => {
		let tabsLinkTarget = e.target;
		if (!tabsLinkTarget.classList.contains('tab_links')) {
			return
		}
		e.preventDefault();
		showTab(tabsLinkTarget);
		barchartOutput();
	})
	
}
tabs();
(async() => {
	const sortButtons = document.querySelectorAll('.sort');
	for (var i = 0; i < sortButtons.length; i++) {
		sortButtons[i].addEventListener('click', (e) => {
			let sortType = e.target.getAttribute('data-sort');
			sortData(sortType, e.target);
		});
	}
}) ()

const sortData = (sortType, elemSort) => {
	let sortTypeArr = sortType.split('-');

	let sortRegion = sortTypeArr[0];
	let sortField = sortTypeArr[1];
	let sortDirection = sortTypeArr[2];

	let arrForSort = sortRegion === 'ua' ? ua : world;
	
	
	arrForSort.sort((a, b) => {
		if(sortField === 'region'){
			return sortDirection === 'up' ? (a[sortField].localeCompare(b[sortField])) : (b[sortField].localeCompare(a[sortField]));
		}
		if(sortDirection === 'down'){
			return a[sortField] > b[sortField] ? 1 : -1;
		}
		return a[sortField] > b[sortField] ? -1 : 1;
	});
	if(sortRegion === 'ua'){
		uaElem.innerHTML = htmlGenerate(arrForSort);
	} else {
		worldElem.innerHTML = htmlGenerate(arrForSort);
	}
	if(sortRegion === 'ua' ){
		if(document.querySelector('#ukraine .sort-active') !== null){
			document.querySelector('#ukraine .sort-active').classList.remove('sort-active');
		}
	} else {
		if(document.querySelector('#world .sort-active') !== null){
			document.querySelector('#world .sort-active').classList.remove('sort-active');
		}
	}
	elemSort.classList.add('sort-active');
	barchartOutput(arrForSort);
}

//////////////////// infographica
const barchartGenerate = (region, confirmedMax, bool) => {
	let result = '';
	if(!bool){
		region.sort((a, b) => {
			a = a.confirmed;
			b = b.confirmed;
			return a > b ? -1 : 1;
		});
	}
	
	for(let row = 0; row < region.length; row++){
		result += `<div class="barchart-elem">
				<div class="barchart-elem-region">${region[row].region}</div>
				<div class="barchart-elem-graph"><span  style="width: ${(region[row].confirmed / confirmedMax * 100) > 0.1 ? region[row].confirmed / confirmedMax * 100 : 0.1}%"></span></div>
				<div class="barchart-elem-number">${region[row].confirmed}</div>
			</div>`;
	}
	return result;
}

const barchartOutput = (array = null) => {
	let bool = false;
	let tabsPaneShow = document.querySelector('.tabs_pane_show').getAttribute('id');
	let arrForBarchart;
	if(array != null){
		arrForBarchart = array;
		bool = true;
	} else {
		arrForBarchart = (tabsPaneShow === 'ukraine' ? ua : world).map((elem) => {
			{return {'region': elem.region, 'confirmed': elem.confirmed}}
		});
	}
	let arrForMax = arrForBarchart.map((elem) => elem.confirmed);
	let max = Math.max(...arrForMax);
	document.querySelector('.infographic-barchart').innerHTML = barchartGenerate(arrForBarchart, max, bool);
}
