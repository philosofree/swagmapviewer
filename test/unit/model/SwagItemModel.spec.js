TinCan = require("tincanjs");
var SwagItemModel = require("../../../src/model/SwagItemModel");

describe("SwagItemModel", function() {
	it("can be created from data", function() {
		var jsonData = {
			x: 20,
			y: 21
		};

		var swagItemModel = new SwagItemModel(jsonData);

		expect(swagItemModel.getX()).toBe(20);
		expect(swagItemModel.getY()).toBe(21);
	});

	it("can check if an xAPI statement matches", function() {
		var jsonData = {
			x: 20,
			y: 21,
			object: "http://example.com/activity",
			verb: "http://adlnet.gov/expapi/verbs/completed_test"
		};
		var swagItemModel = new SwagItemModel(jsonData);
		// At first, it should not be complete.
		expect(swagItemModel.isComplete()).toBe(false);
		// First, handle an "attempted" activity. Nothing should happen.
		xApiStatement = {
			"actor": {
				"mbox": "test@example.com"
			},
			"verb": {
				"id": "http://adlnet.gov/expapi/verbs/attempted/"
			},
			"object": {
				"id": "http://example.com/activity"
			}
		};
		swagItemModel.handleXApiStatement(xApiStatement);
		expect(swagItemModel.isComplete()).toBe(false);
		// Then, handle an "completed" activity.
		// Now the data should show that the activity is completed.
		xApiStatement = {
			"actor": {
				"mbox": "test@example.com"
			},
			"verb": {
				"id": "http://adlnet.gov/expapi/verbs/completed_test"
			},
			"object": {
				"id": "http://example.com/activity"
			}
		};
		swagItemModel.handleXApiStatement(xApiStatement);
		expect(swagItemModel.isComplete()).toBe(true);
	});

	it("checks so that the object and verb matches", function() {
		var jsonData = {
			x: 20,
			y: 21,
			object: "http://example.com/activity"
		};
		var swagItemModel = new SwagItemModel(jsonData);
		// This is related to another activity, it should not affect the completion.
		xApiStatement = {
			"actor": {
				"mbox": "test@example.com"
			},
			"verb": {
				"id": "http://adlnet.gov/expapi/verbs/completed/"
			},
			"object": {
				"id": "http://example.com/some/other/activity"
			}
		};
		swagItemModel.handleXApiStatement(xApiStatement);
		expect(swagItemModel.isComplete()).toBe(false);
	});

	it("can have several objects where any of them results in completion", function() {
		var jsonData = {
			x: 20,
			y: 21,
			object: ["http://example.com/activity", "http://example.com/activity2"]
		};

		var swagItemModel = new SwagItemModel(jsonData);

		expect(swagItemModel.isComplete()).toBe(false);
		xApiStatement = {
			"verb": {
				"id": "http://adlnet.gov/expapi/verbs/completed/"
			},
			"object": {
				"id": "http://example.com/activity2"
			}
		};
		swagItemModel.handleXApiStatement(xApiStatement);
		expect(swagItemModel.isComplete()).toBe(true);
	});

	it("can update completion by calling xAPI", function() {
		var mockTinCan = {};
		mockTinCan.getStatements = function(o) {
			expect(o.params.agent).toEqual(jasmine.any(TinCan.Agent));
			expect(o.params.activity).toEqual(jasmine.any(TinCan.Activity));

			expect(o.params.agent.mbox).toEqual("mailto:hello@example.com");
			//expect(o.params.activity.id).toEqual("http://example.com/activity");

			o.callback(null, {
				statements: [{
					"actor": {
						"mbox": "hello@example.com"
					},
					"verb": {
						"id": "http://adlnet.gov/expapi/verbs/completed/"
					},
					"object": {
						"id": "http://example.com/activity2"
					}
				}]
			});
		};

		spyOn(mockTinCan, "getStatements").and.callThrough();

		var mockSwagMapModel = {};
		mockSwagMapModel.getTinCan = function() {
			return mockTinCan;
		}

		mockSwagMapModel.getActorEmail = function() {
			return "hello@example.com";
		}

		var data = {
			x: 20,
			y: 21,
			object: ["http://example.com/activity", "http://example.com/activity2"]
		}

		var updateSpy = jasmine.createSpy();
		var swagItemModel = new SwagItemModel(data);
		swagItemModel.setSwagMapModel(mockSwagMapModel);
		swagItemModel.on("update", updateSpy);
		swagItemModel.updateCompletion();

		expect(updateSpy).toHaveBeenCalled();
		expect(swagItemModel.isComplete()).toBe(true);

		expect(mockTinCan.getStatements.calls.count()).toBe(2);
	});
});