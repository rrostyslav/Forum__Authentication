'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../index');
const should = chai.should();

chai.use(chaiHttp);

describe('Authentication', () => {
    describe('/POST login', () => {
        it('it should to return access and refresh tokens if credentials required', (done) => {
            const cred = {
                username: "username",
                password: "1111"
            }
            chai.request(server)
                .post('/login')
                .send(cred)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('access_token');
                    res.body.should.have.property('refresh_token');
                    done();
                })
        })
    });

    describe('/POST logout', () => {
        it('it should to log out user if refresh_token provided', (done) => {
            const body = {
                refresh_token: 'Refresh token here'
            }
            chai.request(server)
                .post('/logout')
                .send(body)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').eql('Logged out');
                    done();
                })
        });
    });

    describe('/POST logoutall', () => {
        it('it should to log out user all devices if userName provided', (done) => {
            const body = {
                userName: 'user123'
            }
            chai.request(server)
                .post('/logoutall')
                .send(body)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').eql('Logged out on all devices!');
                    done();
                })
        });
    });

    describe('/GET token', () => {
        it('it should to generate new access_token if refresh_token provided and valid', (done) => {
            const body = {
                refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyTmFtZSI6InVzZXJuYW1lMjAwMCIsImlhdCI6MTU4NzkzMDc1NH0.u0tPaYidIFOV2XbH7065vjTWLsyuviCaxn-PeCRDoXs'
            }
            chai.request(server)
                .get('/token')
                .send(body)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('access_token');
                    done();
                })
        });
    });
});