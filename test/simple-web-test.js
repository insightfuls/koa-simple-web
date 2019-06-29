"use strict";

const Router = require("koa-router");
const superagent = require("superagent");

const { assertThat, equalTo, is } = require("hamjest");
const { hasHeader, hasStatusCode } = require("superjest");

const SimpleWeb = require("../src/simple-web");

const port = process.env.PORT || 8080;

describe("simple web", function() {
	let web;

	beforeEach(async function() {
		web = new SimpleWeb({ port: port });
	});

	afterEach(async function() {
		await web.stop();
	});

	it("should not throw error stopping unstarted component", async function() {
		await web.stop();
		await web.start();
	});

	describe("routes", function() {
		beforeEach(async function() {
			web.route(givenRootRoute());

			await web.start();
		});

		it("should mount routes", function(done) {
			superagent.get(`http://localhost:${port}`)
				.end((error, response) => {
					assertThat(response, hasStatusCode(200));
					assertThat(response.text, is("OK"));

					done();
				});
		});

		it("should only allow defined methods", function(done) {
			superagent.post(`http://localhost:${port}`)
				.end((error, response) => {
					assertThat(response, hasStatusCode(405));

					/*
					 * See koa-router for more information about the contents of the 405 response.
					 *
					 * We're not testing koa-router we just want to make sure we've wired the routes together
					 * properly.
					 */
					done();
				});
		});
	});

	describe("middleware", function() {
		beforeEach(async function() {
			web.use(async (ctx, next) => {
				ctx.response.set("x-foo", "bar");

				return await next();
			});

			web.route(givenRootRoute());

			await web.start();
		});

		it("should allow arbitrary middleware", function(done) {
			superagent.get(`http://localhost:${port}`)
				.end((error, response) => {
					assertThat(response, hasStatusCode(200));
					assertThat(response, hasHeader("x-foo", equalTo("bar")));

					done();
				});
		});
	});
});

function givenRootRoute() {
	const router = new Router();

	router.get("/", async (ctx) => {
		ctx.status = 200;
		ctx.body = "OK"
	});

	return router;
}