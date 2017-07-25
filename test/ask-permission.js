import {spawn} from 'child_process';
import test from 'ava';

test.cb('skip in TTY mode', t => {
	t.plan(1);

	const insProcess = spawn('node', [
		'./test/fixtures/sub-process.js'
	]);
	insProcess.on('close', code => {
		t.is(code, 145);
		t.end();
	});
});

test.cb('skip when using the --no-insight flag', t => {
	t.plan(1);

	const insProcess = spawn('node', [
		'./test/fixtures/sub-process.js',
		'--no-insight'
	], {stdio: 'inherit'});
	insProcess.on('close', code => {
		t.is(code, 145);
		t.end();
	});
});

test.cb('skip in CI mode', t => {
	t.plan(1);

	const env = JSON.parse(JSON.stringify(process.env));
	env.CI = true;

	const insProcess = spawn('node', [
		'./test/fixtures/sub-process.js'
	], {stdio: 'inherit', env});
	insProcess.on('close', code => {
		t.is(code, 145);
		t.end();
	});
});

test.cb('skip after timeout', t => {
	t.plan(1);

	const env = JSON.parse(JSON.stringify(process.env));
	env.permissionTimeout = 0.1;

	const insProcess = spawn('node', [
		'./test/fixtures/sub-process.js'
	], {stdio: 'inherit', env});

	insProcess.on('close', code => {
		t.is(code, 145);
		t.end();
	});
});
