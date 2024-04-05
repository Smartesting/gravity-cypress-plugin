export default async function waitForAssertion(assertion: () => void) {
    return new Promise((resolve, reject) => {
        function _wait(waitCount = 0) {
            if (waitCount > 10) {
                return reject('Retried 10 times to get assertion passing')
            }
            try {
                assertion()
                resolve(undefined)
            } catch(err) {
                setTimeout(() => _wait(waitCount + 1), 30)
            }
        }

        _wait()
    })
}
