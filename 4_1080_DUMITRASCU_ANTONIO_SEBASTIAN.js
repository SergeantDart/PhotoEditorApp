		var existsFile = false;
		var canvas = document.getElementById("canvas");
		var context = canvas.getContext("2d");
		var input = document.getElementById("input");
		var canvasBackground = new Image();
		//holds coordinates about the current displayed image on the main canvas
		var image = {};
		//hold coordinates about the current selection on the main canvas
		var selectionRectangle = {};
		//holds information about the original unscaled image
		var unScaledImage = {};
		
		var originalSizeImage = new Image();

		//canvas used to temporarily hold the generated from selection rectangle image 
		var selectedImageCanvas = document.getElementById("selectedImageCanvas");
		
		//canvas used to temporarily hold the newly applied effects image
		var appliedEffectsCanvas = document.getElementById("appliedEffectsCanvas");
		
		//canvas used to temporarily hold the newly applied text by the user image
		var textAppliedCanvas = document.getElementById("textAppliedCanvas");
		
		//canvas used to store FINAL state of the image before download
		var finalImageCanvas = document.getElementById("finalImageCanvas");
		
		//paragraph where we store current displayed image's dimensions
		var dimensionsInfo = document.getElementById("dimensionsInfo");
		
	    dimensionsInfo.innerHTML = "Dimensions: 600 X 600 px";

		//upload an image to the canvas
		//add handlers for onload and onerror events and assigning the image the user provided src
		function inputLoad() {
		  var selectedImage = new Image();
		  selectedImage.onload = drawImageScaled;
		  selectedImage.onerror = fail;
		  selectedImage.src = URL.createObjectURL(this.files[0]);
		};
		
		input.addEventListener("change", inputLoad);
		 
		//the image is drawn inside the canvas, rescaled to fit the canvas dimensions mantaining ratio
		function drawImageScaled() {
		   var widthRatio = canvas.width  / this.width;
		   var heightRatio =  canvas.height / this.height;
		   
		   //choose the ratio of conversion ( to fit into the canvas)
		   ratio  = Math.min(widthRatio, heightRatio);
		   
		   //get new coordinates and dimensions of the resized image
		   image.x = (canvas.width - this.width * ratio) / 2;
		   image.y = (canvas.height - this.height * ratio) / 2;  
		   context.clearRect(0, 0, canvas.width, canvas.height);
		   image.width = this.width * ratio;
		   image.height = this.height * ratio;
		   context.drawImage(this, 0, 0, this.width, this.height, image.x, image.y ,image.width, image.height);
		   
		   //check if the file is uploaded
		   existsFile = true;
		   
		   selectionRectangle.x = unScaledImage.x = image.x 
		   selectionRectangle.y = unScaledImage.y = image.y
		   selectionRectangle.width = unScaledImage.width = image.width;
		   selectionRectangle.height = unScaledImage.height = image.height;
		   		   
		   //set the current background image as the now scaled image
	       canvasBackground.src = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
		   //we always store the default size edited image src for rescaling purposes
		   originalSizeImage.src = generateImageFromRectangleSelection();
		   
		   dimensionsInfo.innerHTML = "Dimensions: " + parseInt(unScaledImage.width) + " X " + parseInt(unScaledImage.height) + " px";
		   
	    }
		
		//any error is handled through a console display message
		function fail() {
		  console.error("The provided file couldn't be loaded.");
		}
		
		//selection rectangle, inside it we have all the information for the current selection
		var mouseIsPressed = false;
		var shiftIsPressed = false;
		var existsSelection = false;
		
		var movedImage = new Image();
		function onMouseDown(e){
			//if shift + mouse event is triggered
			if(e.shiftKey && existsSelection && existsFile
			&& e.pageX - this.offsetLeft <= selectionRectangle.x + selectionRectangle.width 
			&& e.pageX - this.offsetLeft >= selectionRectangle.x 
			&& e.pageY - this.offsetTop <= selectionRectangle.y + selectionRectangle.height
			&& e.pageY - this.offsetTop >= selectionRectangle.y){
				console.log("Inside selection !");
				movedImage.src = generateImageFromRectangleSelection();
				movedImage.onload = function(){
					//crop the part which was cut from de picture
					context.clearRect(selectionRectangle.x, selectionRectangle.y, selectionRectangle.width, selectionRectangle.height);
					//we save the background with the cropped selection
					canvasBackground.src = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
					context.drawImage(movedImage, selectionRectangle.x, selectionRectangle.y, selectionRectangle.width, selectionRectangle.height);
					mouseIsPressed = true;
				}
			}
			//if just mouse event is triggered
			else if(existsFile){
				context.clearRect(0, 0, canvas.width, canvas.height);
				context.drawImage(canvasBackground, 0, 0);
				selectionRectangle.x = e.pageX - this.offsetLeft;
				selectionRectangle.y = e.pageY - this.offsetTop;
				selectionRectangle.width = 0;
				selectionRectangle.height = 0;				
				mouseIsPressed = true;
				existsSelection = false;
			}
		}
		
		function onMouseUp(e){
			if(e.shiftKey && existsFile){
				canvasBackground.src = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
				context.drawImage(canvasBackground, 0, 0);
				selectionRectangle.x = image.x;
				selectionRectangle.y = image.y;
				selectionRectangle.width = image.width;
				selectionRectangle.height = image.height;
			}
			mouseIsPressed = false;
		}
		
		function onMouseMove(e){
			if(mouseIsPressed && existsFile){
				//if shift + mouse move event is triggered
				if(e.shiftKey && existsSelection){
					//redraw the canvas each time we move the selection;
					context.clearRect(0, 0, canvas.width, canvas.height);
					context.drawImage(canvasBackground, 0, 0);
					//draw the moved image on top of the moving-mouse position
					context.drawImage(movedImage, e.pageX - this.offsetLeft, e.pageY - this.offsetTop, selectionRectangle.width, selectionRectangle.height);
				}
				//if just mouse move event is triggered
				else{
					selectionRectangle.width = (e.pageX - this.offsetLeft) - selectionRectangle.x;
					selectionRectangle.height = (e.pageY - this.offsetTop) - selectionRectangle.y;
					drawSelectionRectangle();
					existsSelection = true;
				}
			}
		}
		
		//drawer for the selection rectangle
		function drawSelectionRectangle(){
			context.clearRect(0, 0, canvas.width, canvas.height);
			context.drawImage(canvasBackground, 0, 0);
			context.strokeStyle = "#202020";
			context.lineWidth = 1;
			context.strokeRect(selectionRectangle.x, selectionRectangle.y, selectionRectangle.width, selectionRectangle.height);
			colorHistogramGenerator();
		}
		
		//adding the mouse events to the canvas ( the mouseup event is for the whole document for the purpose of not bugging out selection outside the canvas)
		canvas.addEventListener("mousedown", onMouseDown, false);
		document.addEventListener("mouseup", onMouseUp, false);
		canvas.addEventListener("mousemove", onMouseMove, false);

		//histogram
		var histogramContext = document.getElementById("histogramCanvas").getContext("2d");

		function colorHistogramGenerator(){
			var redDictionary = [];
			var greenDictionary = [];
			var blueDictionary = [];
			
			//get pixel data
			const imageData = context.getImageData(selectionRectangle.x, selectionRectangle.y, selectionRectangle.width, selectionRectangle.height).data;
		
			//create an array for each RGB color
			for(var i = 0; i < 256; i++){
				redDictionary[i] = 0;
				greenDictionary[i] = 0;
				blueDictionary[i] = 0;
			}
			
			//we skip the fourth element because it represents opacity of the pixel and we don't need it 
			//it increments the number of pixels of said color and intensity (0 to 256 for R, G, B)
			for(var i = 0; i < imageData.length; i += 4){
				redDictionary[imageData[i]]++;
				greenDictionary[imageData[i + 1]]++;
				blueDictionary[imageData[i + 2]]++;
			}
		
			//reset histogram canvas
			histogramContext.clearRect(0, 0, histogramCanvas.width, histogramCanvas.height);

			//drawing the 3 histograms
			drawHistogram(redDictionary, "rgb(255,0,0)", 100);
			drawHistogram(greenDictionary, "rgb(0,255,0)", 200);
			drawHistogram(blueDictionary, "rgb(0,0,255)", 300);
			
		}
		
		function drawHistogram(dictionary, color, height){
			//we select the max value of pixels for each histogram for rescaling purposes ( to fit inside the histogram canvas 100px*256px per canvas)
			var max = Math.max.apply(null, dictionary);
			histogramContext.fillStyle = color;
			for(var i = 0; i < 256; i++){
				//rescaling each value accordingly
				var barHeight = (dictionary[i] / max) * 100;
				histogramContext.fillRect(i, height, 1, -Math.round(barHeight));
			}
		}
		
		//returns the image source of the selection rectangle
		function generateImageFromRectangleSelection(){
			var src;
			selectedImageCanvas.style.visibility = "hidden";
			var selectedImageCanvasContext = selectedImageCanvas.getContext("2d");
			selectedImageCanvasContext.clearRect(0, 0, selectedImageCanvas.width, selectedImageCanvas.height);

			//if there is no selection, we get the whole image
			if(selectionRectangle.width == 0 || selectionRectangle.height == 0){
				selectedImageCanvas.width = image.width;
				selectedImageCanvas.height = image.height;
				selectedImageCanvasContext.drawImage(canvas, image.x, image.y, image.width, image.height, 0, 0, selectedImageCanvas.width, selectedImageCanvas.height);
				selectionRectangle.x = image.x;
				selectionRectangle.y = image.y;
				selectionRectangle.width = image.width;
				selectionRectangle.height = image.height;
			//if there is a selection, we only get the selection
			}else{
				selectedImageCanvas.width = selectionRectangle.width;
				selectedImageCanvas.height = selectionRectangle.height;
				selectedImageCanvasContext.drawImage(canvas, selectionRectangle.x, selectionRectangle.y, selectionRectangle.width, selectionRectangle.height, 0, 0, selectedImageCanvas.width, selectedImageCanvas.height);
			}
			//convert temp selected image canvas to data url, to use it as an image src
			src = selectedImageCanvas.toDataURL("image/png").replace("image/png", "image/octet-stream");			
			selectedImageCanvas.width = 0;
			selectedImageCanvas.height = 0;

			return src;
		}
		
		//function for selecting the whole image
		function selectWholeImage(){
			if(existsFile){
				selectionRectangle.x = image.x;
				selectionRectangle.y = image.y;
				selectionRectangle.width = image.width;
				selectionRectangle.height = image.height;
				drawSelectionRectangle();
			}else{
				alert("No image to select yet !");
				throw("No image to select yet !");
			}
		}
		
		function showOriginalImage(){
			if(existsFile){
				input.dispatchEvent(new Event("change"));
			}else{
				alert("No image to show yet !");
				throw("No image to show yet !");
			}
		}
		
		var effectsSelection = document.getElementById("effectsSelection");

		//for applying a select we create a custom made INVISIBLE canvas for the selected portion of / whole image 
		//we draw the image to the custom made canvas using CSS specific filters
		//we crop the selected part from the main canvas
		//then we redraw the applied effects image to the main canvas
		function applyEffects(){
			if(existsFile){
				appliedEffectsCanvas.style.visibility = "hidden";
				var appliedEffectsCanvasContext = appliedEffectsCanvas.getContext("2d");
				appliedEffectsCanvasContext.clearRect(0, 0, appliedEffectsCanvas.width, appliedEffectsCanvas.height);
				//we take the source of the selected image and load it into an image
				context.clearRect(0, 0, canvas.width, canvas.height);
				context.drawImage(canvasBackground, 0, 0);
				var src = generateImageFromRectangleSelection();

				var selectedImage = new Image();
				selectedImage.src = src;
				selectedImage.onload = function() {
					appliedEffectsCanvas.width = selectedImage.width;
					appliedEffectsCanvas.height = selectedImage.height;

					//apply filters and 
					switch(effectsSelection.value) {
						case "blurred":
							appliedEffectsCanvasContext.filter = "blur(5px)";
							break;
						case "sepia":
							appliedEffectsCanvasContext.filter = "sepia(100%)";
							break;
						case "black-and-white":
							appliedEffectsCanvasContext.filter = "grayscale(100%)";
							break;
						default:
							//nothing
					}
					//draw the selected filtered image to the temporary canvas
					appliedEffectsCanvasContext.drawImage(selectedImage, 0, 0);
					appliedEffectsCanvasContext.filter = "";
					//crop the original part from the main canvas which needs to be filtered
					context.clearRect(selectionRectangle.x, selectionRectangle.y, selectionRectangle.width, selectionRectangle.height);
					//fill in the blank with the filtered part from the effects canvas
					context.drawImage(appliedEffectsCanvas, 0, 0, appliedEffectsCanvas.width, appliedEffectsCanvas.height, selectionRectangle.x, selectionRectangle.y, selectionRectangle.width, selectionRectangle.height);
					canvasBackground.src = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
					
					//we always store the default size edited image src for rescaling purposes
					selectionRectangle.x = image.x;
					selectionRectangle.y = image.y;
					selectionRectangle.width = image.width;
					selectionRectangle.height = image.height;
					
					originalSizeImage.src = generateImageFromRectangleSelection();
					
					effectsSelection.value = "";
					appliedEffectsCanvas.width = 0;
					appliedEffectsCanvas.height = 0;
				};
			}else{
				alert("No image to apply effects on yet !");
				throw("No image to apply effects on yet !");
			}
		}
		
		
		//function for resizing picture while mantaining aspect ratio 
		function resizeImage(){
			if(existsFile){
				var ratio = 0;
				var newDimensionTextBox = document.getElementById("newDimensionTextBox");
				var newDimensionValue = newDimensionTextBox.value;
				var widthChoice = document.getElementById("width");
				var heightChoice = document.getElementById("height");
			    var selectedImage = new Image();
			    selectedImage.onerror = fail;
			    selectedImage.src = originalSizeImage.src;
			    selectedImage.onload = function () {
					//if width or height are higher than the canvas dimensions or the dimensions are less than 1 we trhow an error and an alert to the user
					if(width.checked && (newDimensionValue <= 0 || newDimensionValue > canvas.width)){
						alert("Invalid dimensions ! Cannot fit into canvas !");
						newDimensionValue = 0;
						throw("Invalid dimensions ! Cannot fit into canvas !");
					}
					if(height.checked && (newDimensionValue <= 0 || newDimensionValue > canvas.height)){
						alert("Invalid dimensions ! Cannot fit into canvas !");
						newDimensionValue = 0;
						throw("Invalid dimensions ! Cannot fit into canvas !");
					}
					//calculating conversion ratios
					if(width.checked){
						ratio =   newDimensionValue / selectedImage.width;
					}else if(height.checked){
						ratio =  newDimensionValue / selectedImage.height;
					}
				   //we scale the image accordingly to the determined ratio and draw it on the main canvas
				   image.x = (canvas.width - selectedImage.width * ratio) / 2;
				   image.y = (canvas.height - selectedImage.height * ratio) / 2;  
				   image.width = selectedImage.width * ratio;
				   image.height = selectedImage.height * ratio;
				   if(image.width > canvas.width || image.height > canvas.height){
						alert("The scaled image cannot fit into canvas, try again with other values!");
						newDimensionValue = 0;
						throw("The scaled image cannot fit into canvas, try again with other values!");
						
				   }
				   context.clearRect(0, 0, canvas.width, canvas.height);
				   context.drawImage(selectedImage, 0, 0, selectedImage.width, selectedImage.height, image.x, image.y, image.width, image.height);
				   canvasBackground.src = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
				   dimensionsInfo.innerHTML = "Dimensions: " + parseInt(image.width) + " X " + parseInt(image.height) + " px";
				   newDimensionTextBox.value = 0;
			   };
			}else{
				alert("No image to scale yet !");
				throw("No image to scale yet !");
			}
		}
		
		//function for adding text to the image
		function addTextToImage(){
			if(existsFile){
				var imageTextTextBox = document.getElementById("imageTextTextBox");
				var yCoordinateTextBox = document.getElementById("yCoordinateTextBox");
				var xCoordinateTextBox = document.getElementById("xCoordinateTextBox");
				var brushColorInput = document.getElementById("brushColorInput");
				var fontSizeTextBox = document.getElementById("fontSizeTextBox");
				
				textAppliedCanvas.style.visibility = "hidden";
				var textAppliedCanvasContext = textAppliedCanvas.getContext("2d");
				
				//to get rid of the selection rectangle
				context.clearRect(0, 0, canvas.width, canvas.height);
				context.drawImage(canvasBackground, 0, 0);
				
				selectionRectangle.width = 0;
				selectionRectangle.height = 0;
				
				var src = generateImageFromRectangleSelection();
				
				
				var fontSize = fontSizeTextBox.value;
				var color = brushColorInput.value;
				
				var xCoordinate;
				var yCoordinate;
				
				var text = imageTextTextBox.value;

				
				var selectedImage = new Image();
				selectedImage.src = src;
				selectedImage.onload = function() {
					textAppliedCanvas.width = selectedImage.width;
					textAppliedCanvas.height = selectedImage.height;

					textAppliedCanvasContext.clearRect(0, 0, textAppliedCanvas.width, textAppliedCanvas.height);
					//draw our current image on the temp canvas
				    textAppliedCanvasContext.drawImage(selectedImage, 0, 0);
					//check if fontSize is out of bounds
					if(fontSize > 80 || fontSize < 1 ){
						alert("Font size too large or too small ! Try again !");
						fontSizeTextBox.value = 15;
						throw("Font size too large or too small ! Try again !");
					}
					//setting context font for testing and drawing purposes
					textAppliedCanvasContext.font = fontSize + "px Arial";
					
					//setting text coordinates
					xCoordinate = parseInt(xCoordinateTextBox.value + "px", 10);
					yCoordinate = parseInt(yCoordinateTextBox.value + "px", 10) + parseInt(fontSize + "px", 10);
					
					//used to check the width of the text
					var textMetrics = textAppliedCanvasContext.measureText(text);
					
					//check if text respects canvas boundaries
					if(xCoordinate < 0 || xCoordinate + textMetrics.width > selectedImage.width){
						alert("Text cannot fully fit horizontally into canvas ! Try again with new coordinates / font size...");
						fontSizeTextBox.value = 15;
						xCoordinateTextBox.value = 0;
						throw("Text cannot fully fit horizontally into canvas ! Try again with new coordinates / font size...");
					}
					if(yCoordinate < 0 || yCoordinate > textAppliedCanvas.height + parseInt(fontSize + "px", 10)){
						alert("Text cannot fully fit vertically into canvas ! Try again with new coordinates / font size...");
						fontSizeTextBox.value = 15;
						yCoordinateTextBox.value = 0;
						throw("Text cannot fully fit vertically into canvas ! Try again with new coordinates / font size...");
					}
					textAppliedCanvasContext.fillStyle = color;
					
					textAppliedCanvasContext.fillText(text, xCoordinate, yCoordinate);
					
					//empty the original image from the main canvas which needs to be filtered
					context.clearRect(0, 0, canvas.width, canvas.height);
					//fill in the canvas with the added text image from the applied text canvas
					context.drawImage(textAppliedCanvas, 0, 0, textAppliedCanvas.width, textAppliedCanvas.height, selectionRectangle.x, selectionRectangle.y, selectionRectangle.width, selectionRectangle.height);
								
					canvasBackground.src = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
					
					textAppliedCanvasContext.clearRect(0, 0 ,textAppliedCanvas.width, textAppliedCanvas.height);
					//we always store the default size edited image src for rescaling purposes
					selectionRectangle.x = image.x;
					selectionRectangle.y = image.y;
					selectionRectangle.width = image.width;
					selectionRectangle.height = image.height;
					
					originalSizeImage.src = generateImageFromRectangleSelection();
					
					textAppliedCanvas.width = 0;
					textAppliedCanvas.height = 0;
					
					imageTextTextBox.value = "";
					fontSizeTextBox.value = 15;
					xCoordinateTextBox.value = 0;
					yCoordinateTextBox.value = 0;
				
				};
				
			}else{
				alert("No image to write text on yet !");
				throw("No image to write text on yet !");
			}
		}
		
		//function for cropping the selected fragment of the image
		//performed directly on the main canvas
		function cropSelectedFragment(){
			if(existsFile && existsSelection){
				context.clearRect(selectionRectangle.x, selectionRectangle.y, selectionRectangle.width, selectionRectangle.height);
				canvasBackground.src = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
			
				selectionRectangle.x = image.x;
				selectionRectangle.y = image.y;
				selectionRectangle.width = image.width;
				selectionRectangle.height = image.height;
				
				originalSizeImage.src = generateImageFromRectangleSelection();
				
			} else {
				alert("No image / fragment to crop yet !");
				throw("No image / fragment to crop yet !");
			}
		}
		
		//function for saving the image in PNG format
		//we store the final edited image in a temporary custom made canvas than we download it
		function downloadImage(){
		finalImageCanvas.style.visibility = "hidden";
			var finalImageCanvasContext = finalImageCanvas.getContext("2d");
			
			var imageNameTextBox = document.getElementById("imageNameTextBox");
			var imageName = imageNameTextBox.value;
			
			var finalImage;
			if(existsFile){
				if(imageName != ""){
					finalImageCanvas.width = image.width;
					finalImageCanvas.heihgt = image.height;
					finalImageCanvasContext.clearRect(0, 0, finalImageCanvas.width, finalImageCanvas.height);
					finalImageCanvasContext.drawImage(canvas, image.x, image.y, image.width, image.height, 0, 0, finalImageCanvas.width, finalImageCanvas.height);
					finalImage = finalImageCanvas.toDataURL("image/jpeg").replace("img/jpeg", "img/octet-stream");

					finalImage = canvas.toDataURL("image/png", 1.0).replace("image/png", "image/octet-stream");
					
					//we create a ref whics we modify the download and href attributes accordingly
					//to download the image we call an intance of an onclick event on the ref
					var downloadLink = document.createElement("a");
					downloadLink.download = imageName + ".png";
					downloadLink.href = finalImage;
					downloadLink.click();
					finalImageCanvas.width = 0;
					finalImageCanvas.height = 0;
					imageNameTextBox.value = "";
				}else{
					alert("Give a name to your image !");
					throw("Give a name to your image !");
				}
			}else{
				alert("No image to download yet !");
				throw("No image to download yet !");
			}
		}
		
		var selectWholeImageButton = document.getElementById("selectWholeImageButton");
		var showOriginalImageButton = document.getElementById("showOriginalImageButton");
		var addTextToImageButton = document.getElementById("addTextToImageButton");
		var cropButton = document.getElementById("cropButton");
		var downloadButton = document.getElementById("downloadButton");
		
		//assigning event listeners to controls
		addTextToImageButton.addEventListener("click", addTextToImage);
		selectWholeImageButton.addEventListener("click", selectWholeImage, false);
		showOriginalImageButton.addEventListener("click", showOriginalImage, false);
		effectsSelection.addEventListener("change", applyEffects);
		resizeImageButton.addEventListener("click", resizeImage);
		cropButton.addEventListener("click", cropSelectedFragment);
		downloadButton.addEventListener("click", downloadImage);