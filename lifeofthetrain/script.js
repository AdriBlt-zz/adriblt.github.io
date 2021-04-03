(function () {
	
	/**************************** SCRIPT USE ****************************/
	
	// READ DATA FROM THE 2 TSV FILES AND PLOT IN #viedutrain ELEMENT
	// plotTrainsFromTSV("data/dataRoute.tsv", "data/dataCustemers.tsv", "#viedutrain");
	
	// GENERATE DATA RANDOMLY AND PLOT IN body
	plotRandomTrains(50, 1);

	/********************************************************************/
	
	
	// MAIN FUNCTION
	function plotTrains(routeData, custemersData, containerId) {
	
		routeData = routeData || [];
		custemersData = custemersData || [];
	
		/**************************** PARAMETERS ****************************/
		
		// LABELS
		var frenchLabels = {
			mainTitle: "La Vie du Train ",
		
			timeLegend: "Horaire et Jalonnement",
			delayTrainLegend: "Retard (en minutes)",
			custemersLegend: "Nombre de Voyageurs",
			custemersDelayLegend: "Retard Voyageur (en minute voyageur)",
			buttonDelayLegend: "Retard du Train",
			buttonCustemersDelayLegend: "Retard Voyageur",
			ckbDelayLegend: "Retard",
			ckbCustemersLegend: "Voyageurs",
			
			custemersTooltip: " voyageur(s)",
			gettingInTooltip: " montant",
			gettingOutTooltip: " descendant",
			departureTooltip: "Départ de ",
			transitTooltip: "Passage à ",
			arrivalTooltip: "Arrivée à ",
			delayTooltip: " minute(s) de retard",
			ontimeTooltip: "A l'heure",
			aheadTooltip: " minute(s) d'avance",
			betweenTooltip: " entre ",
			andTooltip: " et "
		};
		var englishLabels = {
			mainTitle: "Life of the Train ",
		
			timeLegend: "Train's Timetable and Route",
			delayTrainLegend: "Delay (in minutes)",
			custemersLegend: "Number of Custemers",
			custemersDelayLegend: "Custemers' Delay (in minutes custemers)",
			buttonDelayLegend: "Train's Delay",
			buttonCustemersDelayLegend: "Custemers' Delay",
			ckbDelayLegend: "Delay",
			ckbCustemersLegend: "Custemers",
			
			custemersTooltip: " custemer(s)",
			gettingInTooltip: " getting on",
			gettingOutTooltip: " getting off",
			departureTooltip: "Departure from ",
			transitTooltip: "Transit through ",
			arrivalTooltip: "Arrival at ",
			delayTooltip: " minute(s) of delay",
			ontimeTooltip: "On time",
			aheadTooltip: " minute(s) ahead",
			betweenTooltip: " between ",
			andTooltip: " and "
		};
		
		var labels = englishLabels; 
		// var labels = frenchLabels;
		
		// SVG DIMENSIONS
		var margin = {top: 20, right: 150, bottom: 200, left: 50},
			width = 1200 - margin.left - margin.right,
			height = 600 - margin.top - margin.bottom;
		
		// COLORS
		var selectionColor = "steelblue";
		var delayColor = "red", custemersDelayColor = "orange";
		var minCustemersColor = "#999999", maxCustemersColor = "#333333";
		
		// TIME BEFORE ORIGIN AND AFTER TERMINUS (MILLISEC)
		var deltaTimeOriginTerminus = 1000*60*5;
		
		// D3 ANIMATION DURATION (MILLISEC)
		var transformationDuration = 1000;
			
		/* D3 INTERPOLATE VALUES
		 *	linear - piecewise linear segments, as in a polyline.
		 *	linear-closed - close the linear segments to form a polygon.
		 *	step - alternate between horizontal and vertical segments, as in a step function.
		 *	step-before - alternate between vertical and horizontal segments, as in a step function.
		 *	step-after - alternate between horizontal and vertical segments, as in a step function.
		 *	basis - a B-spline, with control point duplication on the ends.
		 *	basis-open - an open B-spline; may not intersect the start or end.
		 *	basis-closed - a closed B-spline, as in a loop.
		 *	bundle - equivalent to basis, except the tension parameter is used to straighten the spline.
		 *	cardinal - a Cardinal spline, with control point duplication on the ends.
		 *	cardinal-open - an open Cardinal spline; may not intersect the start or end, but will intersect other control points.
		 *	cardinal-closed - a closed Cardinal spline, as in a loop.
		 *	monotone - cubic interpolation that preserves monotonicity in y.
		 */
		var custemersInterpolation = "monotone"; // "basis";
		var delayInterpolation = "monotone";
		
		/* D3 OFFSET VALUES
		 *	silhouette - center the stream, as in ThemeRiver.
		 *	wiggle - minimize weighted change in slope.
		 *	expand - normalize layers to fill the range [0,1].
		 *	zero - use a zero baseline, i.e., the y-axis.
		 */
		var stackOffset = "zero";
		
		// ROUTE POINTS LABELS SHIFT
		var radius = 30, angle = 30;
		var deltaX = radius * Math.sin(angle * Math.PI / 180),
			deltaY = radius * Math.cos(angle * Math.PI / 180);
		
		// MINIMUM LENGTH OF DELAY DOMAIN
		var minimumDomainLength = 10;
			
		/********************************************************************/
		
		
		/**************************** HTML ELEMENTS ****************************/
			
		// MAIN DIV
		var mainContainer = d3.select(containerId);
		if (containerId == undefined || mainContainer[0][0] == null){
			mainContainer = d3.select("body");
		}		
		var divElement = mainContainer.append("div");
			
		// TITLE + TRAIN CHOOSER
		divElement.append("h1")
			.text(labels.mainTitle)
			.append("select")
				.attr("id", "trainSelector");
		
		// CONTENT
		var mainSection = divElement.append("section");
		
		// CONTROLLERS
		var controllerArticle = mainSection.append("article");
		
		// SWITCH TRAIN'S DELAY VS. CUSTEMERS' DELAY
		var custemersDelayButton = controllerArticle
			.append("button")
			.attr("type", "button")
			.style("width", "150px")
			.text(labels.buttonCustemersDelayLegend);
		
		// DELAY CONTROLLER
		var delaySpan = controllerArticle.append("span");
		var delayCheckbox = delaySpan
			.append("input")
			.attr("type", "checkbox")
			.attr("checked", "checked")
			.attr("id", "delayCheckbox");
		delaySpan.append("text").text(labels.ckbDelayLegend);
		
		// CUSTEMERS CONTROLLER
		var custemersSpan = controllerArticle.append("span");
		var custemersCheckbox = custemersSpan
			.append("input")
			.attr("type", "checkbox")
			.attr("checked", "checked")
			.attr("id", "custemersCheckbox");
		custemersSpan.append("text").text(labels.ckbCustemersLegend);
		
		// GRAPH CONTAINER
		var graphArticle = mainSection.append("article");
		
		var trainSelectorElement = document.getElementById('trainSelector');
		var delayCheckboxElement = document.getElementById('delayCheckbox');
		var custemersCheckboxElement = document.getElementById('custemersCheckbox');
		
		/***********************************************************************/	
		
		
		/**************************** D3JS ELEMENTS ****************************/
	
		// LIST OF TRAIN'S ID
		var trainsIdList = [];
		
		// MAP FROM TRAIN'S ID TO TRAIN'S DATA
		var trainsDescription = {};
			
		// TIME FORMAT
		var legendFormat = d3.time.format("%Hh%M");
		var hourFormat = d3.time.format("%H:%M:%S");

		// D3 SCALES
		var timeScale = d3.time.scale()
			.range([0, width]);
		var custemersScale = d3.scale.linear()
			.range([height, 0]);
		var delayScale = d3.scale.linear()
			.range([height, 0]);
		var custemersColor = d3.scale.linear()
			.range([minCustemersColor, maxCustemersColor]);
		
		// D3 AXIS
		var timeAxis = d3.svg.axis()
			.scale(timeScale)
			.orient("bottom")
			.tickFormat("");
		var custumersAxis = d3.svg.axis()
			.scale(custemersScale)
			.orient("left");
		var delayAxis = d3.svg.axis()
			.scale(delayScale)
			.orient("right");
		
		// TRAIN'S DELAY LINE
		var delayLine = d3.svg.line()
			.interpolate(delayInterpolation)   
			.x(function(d) { return timeScale(d.hour); })
			.y(function(d) { return delayScale(d.delay); });
			
		// CUSTEMERS'S FROM-TO AREAS
		var custemersArea = d3.svg.area()
			.interpolate(custemersInterpolation)
			.x(function(d) { return timeScale(d.hour); })
			.y0(function(d) { return custemersScale(d.y0); })
			.y1(function(d) { return custemersScale(d.y0 + d.y); });
		
		// TRAIN'S "SKYLINE" (NUMBER OF CUSTUMERS)
		var skylineLine = d3.svg.line()
			.interpolate(custemersInterpolation)   
			.x(function(d,i) { return timeScale(d.hour); })
			.y(function(d,i) { return custemersScale(d.nbCustemers); });

		
		// D3 STACK OF CUSTEMERS AREAS
		var custemersStack = d3.layout.stack()
			.offset(stackOffset)
			.values(function(d) { return d.values; });

		// D3 MAIN CONTAINER
		var svg = graphArticle.append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
			// .style("border", "solid 1px black")
			.append("g")
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
		
		// TIME AXIS SVG ELEMENT
		var gTimeAxis = svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + height + ")");
				
		// TIME AXIS LEGEND LABEL
		svg.append("text")
			.attr("x", width / 2 )
			.attr("y",  height + margin.bottom)
			.style("text-anchor", "middle")
			.text(labels.timeLegend);
		
		// TIME AXIS STOPS
		var gStops = gTimeAxis.append("g")
			.attr("class", "stops");
			
		// STOPS HATCH PATTERN DEFINITION
		gStops.append('defs')
			.append('pattern')
				.attr('id', 'diagonalHatch')
				.attr('patternUnits', 'userSpaceOnUse')
				.attr('width', 4)
				.attr('height', 4)
			.append('path')
				.attr('d', 'M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2')
				.attr('stroke', '#AAAAAA')
				.attr('stroke-width', 1);
			
		// ROUTE POINTS LABELS
		var routePointsLabel = gTimeAxis.append("text")
			.attr("class", "routePointLegend")
			.style("text-anchor", "start")
			.style("font-size", "1em")
			.attr("x", deltaX)
			.attr("y", deltaY);
			
		// CUSTEMERS D3 ELEMENTS
		var gCustemers = svg.append("g")             
			.attr("class", "data custemers");
		
		// CUSTEMERS AXIS SVG ELEMENT
		var gCustemersAxis = gCustemers.append("g")
			.attr("class", "y axis")
			
		// CUSTEMERS AXIS LEGEND LABEL
		gCustemers.append("text")
			.attr("transform", "rotate(-90)") 
			.attr("y",  -margin.left)
			.attr("x", (-height / 2))
			.attr("dy", "1em")
			.style("text-anchor", "middle")
			.text(labels.custemersLegend);  
		
		// DELAY D3 ELEMENTS
		var gDelay = svg.append("g")             
			.attr("class", "data delay") ;
			
		// DASHED LINE FOR 0 MINUTES DELAY
		var zeroLine = gDelay
			.append("line")
			.attr("stroke-width", 1)
			.style("stroke-dasharray", ("2, 5"));
			
		// TRAIN'S DELAY SVG ELEMENT
		var delayPath = gDelay.append("path")
			.attr("class", "delayLine")
			.style("fill", "none")
			.style("stroke", delayColor)
			.style("stroke-width", "2");
			
		// DELAY AXIS SVG ELEMENT
		var gDelayAxis = gDelay.append("g")             
			.attr("class", "y axis")    
			.attr("transform", "translate(" + width + " ,0)")   
			.style("fill", delayColor);
			
		// DELAY AXIS LEGEND LABEL
		var delayLegend = gDelay.append("text")
			.attr("transform", "translate(" + width + ")rotate(+90)")
			.attr("y", 0 - margin.left)
			.attr("x", (height / 2))
			.attr("dy", "1em")
			.style("text-anchor", "middle")
			.style("fill", delayColor)
			.text(labels.delayTrainLegend);  
			
		// ROUTE POINTS DELAY SET
		var delayCircles = gDelay
				.selectAll("circle.routePointDelay");
				
		// CUSTEMERS STACK AREA SET
		var custemersAreas = gCustemers
				.selectAll(".custemer");
			
		// TRAIN'S "SKYLINE" (NUMBER OF CUSTUMERS) SVG ELEMENT
		var skylinePath = svg.append("path")
			.attr("class", "skylineLine")
			.style("fill", "none")
			.style("stroke", "black")
			.style("stroke-width", "1");
			
		// TOOLTIP ELEMENT FOR MOUSE INFO
		var tooltip = d3.select("body")
			.append("div")
				.attr("class", "tooltip")
				.style({
					"position": "absolute",
					"z-index": "10",
					"visibility": "hidden",
					"border-radius": "5px",
					"padding": "5px",
					"max-width": "300px",
					"background-color": "#CCCCDD",
					"border": "1px solid black",
					"box-shadow": "4px 4px 10px #aaa"
				});
		
		// SET TOOLTIP TEXT AND VISIBILY
		function setTooltip(v) {
			tooltip
				.style("visibility", "visible")
				.html(v);
		}
		
		// SET TOOLTIP LOCATION
		function moveTooltip() {
			tooltip
				.style("left", (d3.event.pageX + 10) + "px")
				.style("top", (d3.event.pageY - 10) + "px");
		}
		
		// HIDE TOOLTIP
		function clearTooltip() {
			tooltip
				.style("visibility", "hidden");
		}
		
		/***********************************************************************/
		
		
		/**************************** DYNAMIC BEHAVIOUR ****************************/		
		
		// true: WATCH THE TRAIN'S DELAY / false: WATCH CUSTEMERS' DELAY
		var isTrainsDelay = true;
		
		// COLOR USED (DEPENDING ON isTrainsDelay VALUE)
		var lineAndPointsColor = delayColor;
		
		// WATCHED TRAIN
		var selectedTrain = undefined;
		
		// FADE FUNCTION TO HIDE OBJECTS
		function fade(obj) {
			obj.transition().duration(transformationDuration).style("opacity", 0);
			obj.transition().delay(transformationDuration).style("display", "none");
		}
		// SHOW FUNCTION TO REVEAL OBJECTS
		function show(obj) {
			obj.style("display", "");
			obj.transition().duration(transformationDuration).style("opacity", 1);
		}
		
		// DELAY CHECKBOX BEHAVIOUR : SHOW / HIDE ELEMENTS
		delayCheckbox.on("click", function() {
			var foo = delayCheckboxElement.checked ? show : fade; 
			foo(gDelay);
		});
		
		// CUSTEMERS CHECKBOX BEHAVIOUR : SHOW / HIDE ELEMENTS
		custemersCheckbox.on("click", function() {
			var foo = custemersCheckboxElement.checked ? show : fade; 
			foo(gCustemers);
		//	foo(skylinePath);					
		});
			
		// CUSTEMERS / TRAINS DELAY BEHAVIOUR : SWITCH BETWEEN VIEWS
		custemersDelayButton.on("click", function() {
			if (selectedTrain != undefined) {
				if (isTrainsDelay) {
					showCustemersDelay(transformationDuration);
				} else {
					showTrainsDelay(transformationDuration);
				}
			}
		});
		
		// SHOW TRAIN'S DELAY : foreach point = delay of train
		function showTrainsDelay(durationTime) {
			isTrainsDelay = true;
			lineAndPointsColor = delayColor;
			custemersDelayButton.text(labels.buttonCustemersDelayLegend);
			delayScale.domain(selectedTrain.delayDomain);
			showRetard(durationTime,
				selectedTrain.delayValues,
				labels.delayTrainLegend
			); 
		}	
			
		// SHOW CUSTEMERS' DELAY : foreach point = delay of train x number of custemers
		function showCustemersDelay(durationTime) {
			isTrainsDelay = false;
			lineAndPointsColor = custemersDelayColor;
			custemersDelayButton.text(labels.buttonDelayLegend);
			delayScale.domain(selectedTrain.custemersDelayDomain);
			showRetard(durationTime,
				selectedTrain.custemersDelay,
				labels.custemersDelayLegend);
		}	
		
		// SWITCH AND SHOW THE RIGHT VIEW
		function showRetard(durationTime, values, legendLabel) {
			var time = durationTime || 0;
			gDelayAxis
				.transition().duration(time)
				.style("fill", lineAndPointsColor)
				.call(delayAxis);
			delayPath
			   .datum(values)
			   .transition().duration(time)
				.style("stroke", lineAndPointsColor)
			   .attr("d", delayLine);
			delayCircles
				.transition().duration(time)
				.attr("cy", function(d, i) {
					return delayScale(values[i].delay);})
				.style("stroke", lineAndPointsColor);
			delayLegend
				.transition().duration(time)
				.style("fill", lineAndPointsColor)
				.text(legendLabel); 
			zeroLine
				.transition().duration(time)
				.attr("x1", timeScale(selectedTrain.dates[0]))
				.attr("x2", timeScale(selectedTrain.dates[1]))
				.attr("y1", delayScale(0))
				.attr("y2", delayScale(0))
				.style("stroke", lineAndPointsColor);
		}
		
		// SHOW SELECTED TRAIN
		d3.select('#trainSelector')
			.on("change", function() {
				selectTrainNumber(trainSelectorElement[trainSelectorElement.selectedIndex].value);
			});
		
		// ADD KEY LISTENER FOR LEFT AND RIGHT ARROWS TO SWITCH BETWEEN TRAINS
		d3.select("body")
			.on("keydown", function() {
				if (d3.event.keyIdentifier == "Right"
					|| d3.event.keyCode == 39) {
					selectNextTrain();
				} else if (d3.event.keyIdentifier == "Left"
					|| d3.event.keyCode == 37) {
					selectPreviousTrain();
				}
			});
		
		// SELECT NEXT / PREVIOUS TRAINS
		function selectNextTrain() {
			var index = trainSelectorElement.selectedIndex + 1;
			if (index == trainsIdList.length) {
				index = 0;
			}
			selectTrainIndex(index);
		}
		function selectPreviousTrain() {
			var index = trainSelectorElement.selectedIndex - 1;
			if (index == -1) {
				index = trainsIdList.length - 1;
			}
			selectTrainIndex(index);
		}
		
		// SELECT THE TRAIN BY ITS INDEX IN "trainsIdList"
		function selectTrainIndex(index) {
			trainSelectorElement.options[trainSelectorElement.selectedIndex].selected = false;
			trainSelectorElement.options[index].selected = true;
			selectTrainNumber(trainsIdList[index]);
		}
		
		// SELECT THE TRAIN BY ITS NUMBER (ID)
		function selectTrainNumber(num) {
			var dataTrain = trainsDescription[num];
			if (dataTrain != undefined) {
				changeTrain(dataTrain);
			}
		}
		
		/***************************************************************************/	
	
	
		/**************************** INITIALIZE DATA ****************************/	
		
		// READING TRAIN'S ID
		routeData.forEach(function(d, i) {
			if (d.number == undefined || d.day == undefined) {
				return;
			}
			var num = d.number + " (" + d.day + ")";
			d.train = num;
			if (trainsIdList.indexOf(num) < 0) {
				trainsIdList.push(num);
				trainsDescription[num] = {
					route: [],							// DESCRIPTION OF TRAIN'S ROUTE (with Origin and Terminus added)
					delayValues: [],					// DESCRIPTION OF TRAIN'S ROUTE (without Origin and Terminus added)
					custemers: [],						// CUSTEMERS FROM-TO MASS
					stops:[],							// SET OF TRAIN'S STOPS
					dates: [new Date(), new Date()],	// TIME DOMAIN
					delayDomain: [],					// DELAY DOMAIN
					nbCustemersMax: 0,					// NUMBER OF CUSTEMERS MAX
					custemersDelay: [], 				// FOREACH POINT : DELAY * NUMBER OF CUSTEMERS
					custemersDelayDomain: [], 			// CUSTEMERS' DELAY DOMAIN
					hasCustemers: false,				// TRAIN CONTAINS CUSTEMERS DATA
					hasDelay: false						// TRAIN DELAY CUSTEMERS DATA
				};
			}
			trainsDescription[num].route.push(d);
		});
		
		// NO TRAINS
		if (trainsIdList.length == 0) {
			return;
		}
		
		// READING CUSTEMERS' DATA AND BIND IT TO THE RELATED TRAIN
		custemersData.forEach(function(d){
			if (d.number == undefined || d.day == undefined) {
				return;
			}
			var num = d.number + " (" + d.day + ")";
			d.train = num;
			if (num !== undefined && trainsIdList.indexOf(d.train) >= 0
				&& d.nbCustemers > 0) {
				trainsDescription[num].custemers.push(d);
			}
			// ELSE : UNUSED DATA, TRAIN'S ROUTE NEEDED!
		});
		
		// INITIALIZE EACH TRAIN DATA AND ADD ID TO HTML SELECTOR
		trainsIdList.forEach(function(numTrain) {
			var train = trainsDescription[numTrain];
			initializeTrain(train);
			// if (train.hasCustemers || train.hasDelay) {
			var opt = document.createElement('option');
			opt.value = numTrain;
			opt.innerHTML = numTrain;
			trainSelectorElement.appendChild(opt);
			// }
		});
		
		// COMPUTING TRAIN'S DATA FOR VISUALIZATION
		function initializeTrain(trainData) {
			var lastDate = -1;
			trainData.route.forEach(function(d, i) {
				
				// IN CASE A TRAIN'S ROUTE CROSSES MIDNIGHT
				if (lastDate != -1 && d.hour.getTime() < lastDate) {
					d.hour = new Date(d.hour.getTime() + 24*3600*1000);
				}
				lastDate = d.hour.getTime();
				
				// REDAING STOPS
				if (d.type == "D") {
					trainData.stops.push({
						route: d, 
						index: i, 
						nbAdded: +0, 
						nbRemoved: +0
					});
				}
				
				// TRAIN CONTAINS NON ZERO DELAY DATA
				if (d.delay != 0) {
					trainData.hasDelay = true;
				}
				
				// INITIALIZE NUMBER OF CUSTEMERS
				d.nbCustemers = 0;
			});
			
			
			var routeSize = trainData.route.length;
			
			// TERMINUS NEEDS TO BE ADDED AS IT DOES NOT HAVE DEPARTURE
			trainData.stops.push({
				route: trainData.route[routeSize-1],
				index: routeSize,
				nbAdded: +0, 
				nbRemoved: +0
			});
			
			// COPY OF TRAIN'S ROUTE
			trainData.route.forEach(function(d) {
				trainData.delayValues.push(d);
			});
			
			// DELAY DOMAIN
			trainData.delayDomain = d3.extent(trainData.delayValues, function(d) {return +d.delay;} );
			if (trainData.delayDomain[0] > 0) {
				trainData.delayDomain[0] = 0;
			}
			var delayDomainLength = trainData.delayDomain[1] - trainData.delayDomain[0];
			if (delayDomainLength < minimumDomainLength) {
				trainData.delayDomain[1] += minimumDomainLength - delayDomainLength;
			}
			
			// TRAIN'S LIFE TIME SCALE
			trainData.dates[0].setTime(trainData.route[0].hour.getTime() - deltaTimeOriginTerminus);
			trainData.dates[1].setTime(trainData.route[trainData.route.length-1].hour.getTime() + deltaTimeOriginTerminus);
			
			// FIRST POINT
			trainData.route.unshift({
				pointId: trainData.route[0].pointId,
				pointName: trainData.route[0].pointName,
				hour: trainData.dates[0],
				type: "O",
				delay: 0,
				nbCustemers: 0
			});
			
			// LAST POINT
			trainData.route.push({
				pointId: trainData.route[trainData.route.length-1].pointId,
				pointName: trainData.route[trainData.route.length-1].pointName,
				hour: trainData.dates[1],
				type: "T",
				delay: 0,
				nbCustemers: 0
			});
		
			// ADD CUSTEMERS TO ROUTE
			trainData.custemers.forEach(function(custemer) {
				var status = -1;
				trainData.route.forEach(function(pointRoute, indexPoint) {
					if (status < 0) {
						if (pointRoute.pointId == custemer.inPoint) {
							status = 0;
							custemer.inPointIndex = indexPoint;
							trainData.stops.forEach(function(dd) {
								if (dd.route.pointId == pointRoute.pointId) {
									dd.nbAdded += +custemer.nbCustemers;
								}
							});
						}			
					} else if (status == 0){
						pointRoute.nbCustemers += +custemer.nbCustemers;
						if (pointRoute.pointId == custemer.outPoint) {
							status = 1;
							custemer.outPointIndex = indexPoint + 1;
							trainData.stops.forEach(function(dd) {
								if (dd.route.pointId == pointRoute.pointId) {
									dd.nbRemoved += +custemer.nbCustemers;
								}
							});
						}			
					}
				});	
			});	
			trainData.nbCustemersMax = d3.max(trainData.route, function(d) {return d.nbCustemers;});
			
			// COMPUTE CUSTEMERS' DELAY
			for (var i = 1; i < trainData.route.length-1; i++) {
				trainData.custemersDelay.push({
					hour: trainData.route[i].hour,
					delay: trainData.route[i].delay * trainData.route[i].nbCustemers
				});
			}
			
			// CUSTEMERS' DELAY DOMAIN
			trainData.custemersDelayDomain = d3.extent(trainData.custemersDelay, function(d) {return +d.delay;} );
			if (trainData.custemersDelayDomain[0] > 0) {
				trainData.custemersDelayDomain[0] = 0;
			}
			var custemersDelayDomainLength = trainData.custemersDelayDomain[1] - trainData.custemersDelayDomain[0];
			if (custemersDelayDomainLength < minimumDomainLength) {
				trainData.custemersDelayDomain[1] += minimumDomainLength - custemersDelayDomainLength;
			}
			
			// SET CUSTEMERS'S FLOW VALUE = NUMBER OF CUSTEMERS * DURATION OF THE JOURNEY
			// (ONE CAN ALSO USE NUMBER OF CUSTEMERS * TRAVELLED DISTANCE)
			trainData.custemers.forEach(function(d){
				var journeyDuration = trainData.route[d.outPointIndex].hour.getTime()
					- trainData.route[d.inPointIndex].hour.getTime();
				d.flowValue = d.nbCustemers * journeyDuration;
			});	
			
			// SORT CUSTEMERS BY DESCENDING IMPORTANCE 
			trainData.custemers.sort(function(a, b) {
				return - a.flowValue + b.flowValue;
			});
			
			// SET CUSTEMERS' ROUTE (FOR THE STACKS)
			trainData.custemers.forEach(function(d, j) {
				d.route = [];
				trainData.route.forEach(function(entry, i) {
					if (i > trainData.custemers[j].inPointIndex && i < trainData.custemers[j].outPointIndex) {
						d.route.push(+d.nbCustemers);
					} else {
						d.route.push(+0);
					}
				});
			});
			
			// TRAIN CONTAINS CUSTEMERS DATA
			trainData.hasCustemers = trainData.custemers.length > 0;
		}
		
		/*************************************************************************/	
		
		
		// BIND D3 WITH THE DATA
		function changeTrain(dataTrain) {
		
			/**************************** BINDING TRAIN DATA TO GRAPH ****************************/
			
			// GLOBAL VARIABLE TO STOCK THE CURRENT DATA
			selectedTrain = dataTrain;
		
			// UPDATING TIME AXIS
			timeScale.domain(dataTrain.dates);
			timeAxis.tickValues(dataTrain.route.map(function(d){return d.hour;}));
			gTimeAxis.call(timeAxis);
			
			// UPDATING DELAY AXIS
			delayScale.domain(dataTrain.delayDomain);
			gDelayAxis.call(delayAxis);
			
			// UPDATING NUMBER OF CUSTEMERS AXIS
			custemersScale.domain([0, dataTrain.nbCustemersMax]);
			gCustemersAxis.call(custumersAxis);
			
			// NICE AND CLEAN AXIS
			d3.selectAll(".axis path, .axis line")
			.style({
				"fill": "none",
				"stroke": "#000",
				"shape-rendering": "crispEdges"
			});
			
			// SHORTCUT TO GET THE X POSITION OF THE i-th POINT
			function getRoutePointPosition(i) {
				return timeScale(dataTrain.route[i].hour);
			}
		
			// STOPS TOOLTIP
			function getSopTooltip(d) {
				var strRemoved = d.nbRemoved + labels.custemersTooltip + labels.gettingOutTooltip;
				var strAdded = d.nbAdded + labels.custemersTooltip + labels.gettingInTooltip;
				if (d.nbAdded > 0 && d.nbRemoved > 0) {
					return strRemoved + labels.andTooltip + "<br/>" + strAdded;
				}
				if (d.nbRemoved > 0) {
					return strRemoved;
				}
				if (d.nbAdded > 0) {
					return strAdded;
				}
				return "";
			}
			
			// MOUSE OVER STOPS BEHAVIOUR
			function mouseOverStop(stop, stopIndex) {
				if (dataTrain.hasCustemers) {
					// HIGHTLIGTH THE CUSTEMERS' AREAS IF THE STOP IS EITHER GETTING IN OR OUT POINT
					gCustemers.selectAll(".custemer").select("path")
							.style("fill", function(custemerElm, custemerIndex) { 
								return (dataTrain.custemers[custemerIndex].inPointIndex == stop.index 
									|| dataTrain.custemers[custemerIndex].outPointIndex - 1 == stop.index) 
									? selectionColor : custemersColor(dataTrain.custemers[custemerIndex].flowValue); 
							});
					// SET STOP TOOLTIP
					setTooltip(getSopTooltip(stop));
				}
				svg.selectAll("text.stopLegend")
					.style("font-weight", function(legendElm, legendIndex){
						// CURRENT STOP
						if (stopIndex == legendIndex) {
							return "bold";
						}
						var font = "normal";
						// PUTTING IN BOLD RELATED STOPS (WITH CUSTEMERS FROM ONE TO THE OTHER)
						dataTrain.custemers.forEach(function(dV) {
							if ((dV.inPoint == stop.route.pointId 
								&& dV.outPoint == dataTrain.stops[legendIndex].route.pointId)
							|| (dV.outPoint == stop.route.pointId 
								&& dV.inPoint == dataTrain.stops[legendIndex].route.pointId)) {
								font = "bold";
								return;
							}
						});
						return font;
					});
			}
			
			// CLEAR WHEN MOUSE OUT
			function mouseOutStop() {
				if (dataTrain.hasCustemers) {
					gCustemers.selectAll(".custemer")
						.select("path")
						.style("fill", function(dd, ii) { 
								return custemersColor(dataTrain.custemers[ii].flowValue); 
						});		
				}
				svg.selectAll("text.stopLegend")
					.style("font-weight", "normal");
				clearTooltip();
			}
			
			// REMOVE ALL STOPS BEFORE ADDING THE NEW
			gStops
				.selectAll("g.stopRetangle")
				.remove();
			
			// ADDING ONE HATCH RECTANGLE WITH ROTATED LEGEND BY STOP
			dataTrain.stops.forEach(function(d, i){
				var gRect = gStops
					.append("g", ":first-child")
						.attr("class", "stopRetangle")
						.attr("transform", function() {
							return "translate(" + getRoutePointPosition(d.index)+ ",1)";
						});
						
				// HATCHED RECTANGLE
				gRect
					.append("rect")
						.attr("width", getRoutePointPosition(d.index+1) - getRoutePointPosition(d.index))
						.attr("height", 20)
						.attr('fill', 'url(#diagonalHatch)')
						.on("mouseover", function() { mouseOverStop(d, i); })
						.on("mousemove", moveTooltip)
						.on("mouseout", mouseOutStop);
				
				// STOP LEGEND ("HOUR : POINT NAME")
				gRect
					.append("text")
						.attr("class", "stopLegend")
						.style("text-anchor", "start")
						.style("font-size", "1em")
						.attr("x", deltaX)
						.attr("y", deltaY)
						.attr("transform", "translate(" 
							+ (getRoutePointPosition(d.index+1) - getRoutePointPosition(d.index)) / 2 
							+ ")rotate(" + angle + ")")
						.text(legendFormat(d.route.hour) + " : " + d.route.pointName);
			});
			
			// UPDATING ZERO LINE DELAY POSITION
			zeroLine
				.attr("x1", timeScale(dataTrain.dates[0]))
				.attr("x2", timeScale(dataTrain.dates[1]))
				.attr("y1", delayScale(0))
				.attr("y2", delayScale(0));
				
			// BINDING DELAY CIRCLE WITH DATA
			delayCircles = gDelay
				.selectAll("circle.routePointDelay")
				.data(dataTrain.delayValues);
			
			// ADDING MISSING ONES
			delayCircles.enter()
				.append("circle")
				.attr("class", "routePointDelay")
				.attr("r", 4)
				.style("fill", "white")
				.style("stroke-width", "2");
			
			// UPDATE POSITION
			delayCircles.attr("cx", function(d) {return timeScale(d.hour);});
			
			// REMOVE EXTRA POINTS
			delayCircles.exit().remove();
				
			// SHOW TRAIN / CUSTEMER DELAY
			if (!isTrainsDelay && dataTrain.hasCustemers) {
				showCustemersDelay();
			} else {
				showTrainsDelay();
			}
			
			// DELAY CIRCLES TOOLTIP
			function getDelayCircleTooltip(delayValue) {
				var pointType = 
					("D" == delayValue.type) ? labels.departureTooltip : 
					("P" == delayValue.type) ? labels.transitTooltip :
					("A" == delayValue.type) ? labels.arrivalTooltip : "";
				var delayType = 
					(delayValue.delay > 0) ? delayValue.delay + labels.delayTooltip :
					(delayValue.delay < 0) ? -delayValue.delay + labels.aheadTooltip :
					labels.ontimeTooltip;
				return hourFormat(delayValue.hour) + " : " + pointType + " " 
					+ delayValue.pointName + "<br/>" + delayType;
			}
			
			// MOUSE OVER DELAY CIRCLES BEHAVIOUR
			function mouseOverDelayCircle(circleElm, circleIndex){
				// FILL CIRCLE
				delayCircles
					.style("fill",function(dd, ii){
						return (circleIndex == ii) ? lineAndPointsColor : "white";
					});
				// IF IS STOP : BOLD IT
				if (isStopPoint(dataTrain.delayValues[circleIndex].pointId)) {
					svg.selectAll("g.x.axis text.stopLegend")
						.style("font-weight", function(dd, ii){
							return (circleElm.pointId == dataTrain.stops[ii].route.pointId) ? "bold" : "normal";
						});
				} else {
					// ELSE SHOW LEGEND
					routePointsLabel
						.attr("transform", "translate(" 
								+ getRoutePointPosition(circleIndex + 1) + ")rotate(" + angle + ")")
							.text(function(){
								return legendFormat(dataTrain.route[circleIndex + 1].hour)
									+ " : " + dataTrain.route[circleIndex + 1].pointName;
							});
				
				}
				setTooltip(getDelayCircleTooltip(dataTrain.delayValues[circleIndex]));
			}
			
			// CLEAR CIRCLES AND LEGEND WHEN MOUSE OUT
			function mouseOutDelayCircle() {
				delayCircles
					.style("fill", "white");
				svg.selectAll("text.stopLegend")
					.style("font-weight", "normal");
				routePointsLabel
					.text("");
				clearTooltip();
			}
			
			// DELAY CIRCLES BEHAVIOUR
			delayCircles
				.on("mouseover", mouseOverDelayCircle)
				.on("mousemove", moveTooltip)
				.on("mouseout", mouseOutDelayCircle);
			
			// IS THE POINT A STOP OF THE TRAIN?
			function isStopPoint(routePointId) {
				for (var i=0; i < dataTrain.stops.length; i++) {
					if (dataTrain.stops[i].route.pointId === routePointId) {
						return true;
					}
				}
				return false;
			}
			
			// UPDATE THE CUSTEMERS FLOW VALUE DOMAIN
			custemersColor.domain(d3.extent(dataTrain.custemers, function(d) { return d.flowValue; }));
			
			// NAME FOR THE CUSTEMERS (NUMBER OF CUSTEMERS)
			function getCustemersAreaTitle(custemer) {
				return  +custemer.nbCustemers + labels.custemersTooltip;
			}	
			
			// CREATE CUSTEMERS STACKED DATA
			var custemersStackData = d3.range(dataTrain.custemers.length).map(function(i) {
				return {
					name: getCustemersAreaTitle(dataTrain.custemers[i]),
					values: dataTrain.custemers[i].route.map(function(d, j) {
						return {hour: dataTrain.route[j].hour, y: d};
					})
				};
			});
				
			// BIND STACK WITH DATA
			custemersAreas = gCustemers.selectAll(".custemer")
					.data(custemersStack(custemersStackData));
					
			// ADD MISSING AREAS
			custemersAreas.enter()
				.append("g") 
					.attr("class", "custemer")
					.append("path")
						.attr("class", "area");
			
			// CUSTEMERS AREA TOOLTIP
			function getCustemersAreaTooltip(custemer) {
				return  +custemer.nbCustemers + labels.custemersTooltip 
					+ labels.betweenTooltip + "<br/>" 
					+ dataTrain.route[custemer.inPointIndex].pointName
					+ labels.andTooltip + "<br/>" 
					+ dataTrain.route[custemer.outPointIndex].pointName;
			}
			
			// MOUSE OVER CUSTEMERS AREA BEHAVIOUR
			function mouseOverCustemersArea(area, areaIndex) {
				// HIGHTLIGHT AREA
				custemersAreas.select("path")
					.style("fill", function(d, ii) {
						return areaIndex == ii ? selectionColor : custemersColor(dataTrain.custemers[ii].flowValue); 
					});
				var prDeb = dataTrain.custemers[areaIndex].inPoint;
				var prFin = dataTrain.custemers[areaIndex].outPoint;
				
				// BOLD RELATED STOP POINTS
				svg.selectAll("text.stopLegend")
					.style("font-weight", function(dd, ii){
						return (prDeb == dataTrain.stops[ii].route.pointId 
							|| prFin == dataTrain.stops[ii].route.pointId)
							? "bold" : "normal";
					});
				
				// SHOW TOOLTIP
				setTooltip(getCustemersAreaTooltip(dataTrain.custemers[areaIndex]));
			}
			
			// CLEAR WHEN MOUSE OUT
			function mouseOutVoyageur() {
				custemersAreas.select("path")
					.style("fill", function(d, i) { 
					return custemersColor(dataTrain.custemers[i].flowValue); 
				});
				svg.selectAll("text.stopLegend")
					.style("font-weight", "normal");
				clearTooltip();
			}
			
			// ADD CUSTEMERS AREA BEHAVIOUR
			custemersAreas.select("path")
				.attr("d", function(d) { return custemersArea(d.values); })
				.style("fill", function(d, i) { return custemersColor(dataTrain.custemers[i].flowValue); })
				.style("stroke", "white")
				.style("stroke-width", "0.1")
				.on("mouseover", mouseOverCustemersArea)
				.on("mousemove", moveTooltip)
				.on("mouseout", mouseOutVoyageur);
				
			// REMOVE EXTRA AREAS
			custemersAreas.exit().remove();

			// UPDATE SKYLINE SHAPE
			skylinePath
				.datum(dataTrain.route)
				.attr("d", skylineLine);
				
			/*************************************************************************************/
			
			/**************************** UPDATE CONTROLLERS ****************************/
			
			// SHOW / HIDE CUSTEMERS DATA (WHETHER hasCustemers)
			var displayVoyageurs = dataTrain.hasCustemers ? "" : "none";
			gCustemers.style("display", displayVoyageurs);
			skylinePath.style("display", displayVoyageurs);
			
			// SHOW / HIDE DELAY DATA (WHETHER hasDelay)
			var displayRetard = dataTrain.hasDelay ? "" : "none";
			gDelay.style("display", displayRetard);
			
			// SHOW / HIDE CUSTEMERS AND DELAY CONTROLERS
			custemersCheckbox.attr("disabled", dataTrain.hasCustemers ? null : "true");
			delayCheckbox.attr("disabled", dataTrain.hasDelay ? null : "true");
			custemersDelayButton.attr("disabled", 
				(dataTrain.hasCustemers && dataTrain.hasDelay) ? null : "true");
				
			/****************************************************************************/
			
		}
		
		// INITIALIZATION
		selectTrainIndex(0);
	}
	
	
	/**************************** IMPORT DATA ****************************/
	
	// READ DATA FROM 2 TSV FILES (TABULATION SEPARATED VALUES)
	// @param routeSrc		PATH FOR THE TSV FILE OF ROUTE DEFINITAION (SEE DESCRIPTION BELOW)
	// @param custemersSrc	PATH FOR THE TSV FILE OF CUSTEMERS FLOW (SEE DESCRIPTION BELOW)
	// @param containerId	ID OF THE HTML CONTAINER WISHED FOR THE GRAPH (EX: "#graph") (body IF UNDEFINED OR UNEXISTANT)
	function plotTrainsFromTSV(routeSrc, custemersSrc, containerId) {
		var hourFormat = d3.time.format("%H:%M:%S");
		var routeData = [];
		var custemersData = [];
		
		// READING ROUTE DEFINITION OF TRAINS (WITH DELAY (optional))
		d3.tsv(routeSrc, function(error, dataRoute) {
			if (dataRoute !== undefined) {
				dataRoute.forEach(function(d) {
					routeData.push({
						// [String] NAME / NUMBER OF THE TRAIN
						number: d.number,
						
						// [String] Date of the circulation (not parsed)
						day: d.day,
						
						// [String] ID of the route point
						pointId: d.pointId,
						
						// [String] Name of the route point (optional)
						pointName: d.pointName || "",
						
						// [Date "HH:MM:SS"] Hour of passage at route point (HH is from 0 to 23)
						hour: hourFormat.parse(d.hour),
						
						// [Integer] Delay in minutes (optional)
						delay: +d.delay || 0,
						
						// [String] Type of passage (D=Departure, P=Passage/Transit, A=Arrival)
						type: d.type
					});
				});
			}
			
			// READING THE FLOW OF CUSTEMERS IN THESE TRAINS
			d3.tsv(custemersSrc, function(error, dataCustemers) {
				if (dataCustemers !== undefined) {
					dataCustemers.forEach(function(d) {
						custemersData.push({
							// [String] NAME / NUMBER OF THE TRAIN
							number: d.number,
						
							// [String] Date of the circulation (not parsed)
							day: d.day,
							
							// [String] ID of the route point where custemers get in
							inPoint: d.inPoint,
							
							// [String] ID of the route point where custemers get out
							outPoint: d.outPoint,
							
							// [Integer] Number of custemers
							nbCustemers: +d.nbCustemers
						});
					});
				}
				
				// PLOT TO PAGE
				plotTrains(routeData, custemersData, containerId);
			});
		});
	}
	
	/*********************************************************************/
	
	
	/**************************** RANDOM DATA ****************************/
	
	// RETURN RANDOM INT IN [min,max[
	function nextInt(min, max) {
		return Math.floor(Math.random() * (max-min) + min);
	}
	
	// PRINT DATE IN "DD/MM/YY" FORMAT (DATE = "01/01/2015" + 'day' DAYS)
	function getDateToString(day) {
		var nbDays = [31,28,31,30,31,30,31,31,30,31,30,31];
		var year = 2015;
		var month = 0;
		var d = day;
		for(;;) {
			if (d <= nbDays[month]) {
				break;
			}
			d -= nbDays[month];
			month++;
			if (month == nbDays.length) {
				month = 0;
				year++;
			}
		}
		month++; // 0-11 -> 1-12
		return (d < 10 ? "0" : "") + d + "/" 
			+ (month < 10 ? "0" : "") + month + "/" 
			+ year;
	}
	
	// GENERATE A RANDOM TRAIN ROUTE
	function getRandomPattern() {
		var train = {
			route: [],
			stops: []
		}
		var o = 0;
		var secOfDay = nextInt(0, 3600*24);
		var origin = {
			pointId: "PR_O",
			pointName: "Town Origin",
			hour: new Date(1000 * secOfDay),
			type: "D"
		};
		train.route.push(origin);
		train.stops.push("PR_O");
		var nStops = nextInt(1, 5);
		for (var s = 0; s <= nStops; s++) {
			secOfDay += nextInt(5*60, 20*60);
			if (s > 0) {
				var idStop = "PR_" + s;
				var stopA = {
					pointId: idStop,
					pointName: "Town " + s,
					hour: new Date(1000 * secOfDay),
					type: "A"
				};
				train.route.push(stopA);
				secOfDay += nextInt(2*60, 10*60);
				var stopD = {
					pointId: idStop,
					pointName: "Town " + s,
					hour: new Date(1000 * secOfDay),
					type: "D"
				};
				train.route.push(stopD);
				train.stops.push(idStop);
			}
			var nbPassages = nextInt(5, 10);
			for (var p = 0; p < nbPassages; p++) {
				secOfDay += nextInt(5*60, 20*60);
				var stopP = {
					pointId: "P_" + s + "." + p,
					pointName: "Point " + s + "." + p,
					hour: new Date(1000 * secOfDay),
					type: "P"
				};
				train.route.push(stopP);
			}
		}
		secOfDay += nextInt(5*60, 20*60);
		var terminus = {
			pointId: "PR_T",
			pointName: "Town Terminus",
			hour: new Date(1000 * secOfDay),
			type: "A"
		};
		train.route.push(terminus);
		train.stops.push("PR_T");
		return train;
	}
	
	// GENERATED AND PLOT RANDOM DATA
	// @param 'nbNums'		NUMBER OF DIFFERENT TRAIN NUMBER 
	// @param 'nbDays'		NUMBER OF DATES FOR EACH TAIN NUMBER
	// @param containerId	ID OF THE HTML CONTAINER WISHED FOR THE GRAPH (EX: "#graph") (body IF UNDEFINED OR UNEXISTANT)
	function plotRandomTrains(nbNums, nbDays, containerId) {
		var routeData = [];
		var custemersData = [];
		for (var num = 0; num < nbNums; num++) {
			var number = "Train #" + num;
			var train = getRandomPattern();
			var nbStops = train.stops.length;
			for (var dayOfWeek = 0; dayOfWeek < nbDays; dayOfWeek++) {
				var day = getDateToString(dayOfWeek + 1);
				var delay = nextInt(-5, 15);
				if (nextInt(0, 75) < 10) {
					delay += 15;
				}
				for (var r in train.route) {
					if (train.route[r].type == "D") {
						if (nextInt(0, 75) < 10) {
							delay += 15;
						}
						if (delay < 0) {
							delay = 0;
						}
					}
					routeData.push({
						number: number,
						day: day,
						pointId: train.route[r].pointId,
						pointName: train.route[r].pointName,
						hour: train.route[r].hour,
						delay: delay,
						type: train.route[r].type
					});
					if (train.route[r].type == "A") {
						delay += nextInt(-2, 2);
					} else {
						if (delay <= 0) {
							delay += Math.floor(nextInt(-110, 150)/100);
						} else {
							delay += Math.floor(nextInt(-110, 200)/100);
						}
					}
				}
				for (var sO = 0; sO < nbStops-1; sO++) {
					for (var sD = sO + 1; sD < nbStops; sD++) {
						custemersData.push({
							number: number,
							day: day,
							inPoint: train.stops[sO],
							outPoint: train.stops[sD],
							nbCustemers: +nextInt(0, 40)
						});
					}
				}
			}
		}
		plotTrains(routeData, custemersData, containerId);
	}
	
	/*********************************************************************/
	
})();
