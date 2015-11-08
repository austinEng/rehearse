angular.module('rehearse', []).controller('Stats', function() {
    // Grab data for the particular user
	var data = {
  pauses: 
   [ [ 'our', 'car', 0 ],
     [ 'car', 'yet', 0.16000000000000003 ],
     [ 'yet', 'so', 0 ] ],
  hesitations: [],
  wpm: 149.06832298136646,
  enunciations: 
   [ [ 'our', 0.35, 0.48 ],
     [ 'car', 0.48, 0.73 ],
     [ 'yet', 0.89, 1.16 ],
     [ 'so', 1.16, 1.61 ] ],
  sentence: 'our car yet so' };
    $scope.data = data;
    var stats = this;
	
});