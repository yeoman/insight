import execa from 'execa';
import test from 'ava';

test('skip in TTY mode', async t => {
	const err = await t.throws(execa('node', ['./test/fixtures/sub-process.js']));
	t.is(err.code, 145);
});

test('skip when using the --no-insight flag', async t => {
	const err = await t.throws(execa('node', ['./test/fixtures/sub-process.js', '--no-insight'], {stdio: 'inherit'}));
	t.is(err.code, 145);
});

test('skip in CI mode', async t => {
	const CI = process.env.CI;
	process.env.CI = true;

	const err = await t.throws(execa('node', ['./test/fixtures/sub-process.js'], {stdio: 'inherit'}));
	t.is(err.code, 145);

	process.env.CI = CI;
});

test('skip after timeout', async t => {
	const CI = process.env.CI;
	const permissionTimeout = process.env.permissionTimeout;

	process.env.CI = true;
	process.env.permissionTimeout = 0.1;

	const err = await t.throws(execa('node', ['./test/fixtures/sub-process.js'], {stdio: 'inherit'}));
	t.is(err.code, 145);

	process.env.CI = CI;
	process.env.permissionTimeout = permissionTimeout;
});
